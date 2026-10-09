ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS comprador_nombre text,
  ADD COLUMN IF NOT EXISTS comprador_email text,
  ADD COLUMN IF NOT EXISTS comprador_fecha_nacimiento date;

DROP FUNCTION IF EXISTS public.confirmar_compra_entradas(
  bigint, bigint[], text, text, date
);
DROP FUNCTION IF EXISTS public.confirmar_compra_entradas(
  bigint, bigint[], text, text, date, text, integer
);

CREATE OR REPLACE FUNCTION public.confirmar_compra_entradas(
  p_funcion_id bigint,
  p_butacas_ids bigint[],
  p_comprador_nombre text,
  p_comprador_email text,
  p_fecha_nacimiento date,
  p_codigo_cupon text,
  p_puntos_a_usar integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_pedido_id bigint;
  v_sala_id bigint;
  v_inicio timestamptz;
  v_clasificacion text;
  v_fecha_nacimiento_validada date;
  v_nombre_validado text;
  v_email_validado text;
  v_precio_base numeric(10, 2);
  v_precio_vip numeric(10, 2);
  v_precio_accesible numeric(10, 2);
  v_cantidad integer;
  v_disponibles integer;
  v_filas integer;
  v_numero_minimo integer;
  v_numero_maximo integer;
  v_total numeric(10, 2);
  v_edad integer;
  v_cupon_id bigint;
  v_cupon_porcentaje numeric(5, 2);
  v_cupon_solo_mayores50 boolean;
  v_cupon_tipo text;
  v_tasa_puntos numeric(10, 2) := 1;
  v_valor_punto numeric(10, 2) := 0;
  v_saldo_puntos integer := 0;
  v_puntos_usados integer := 0;
  v_puntos_obtenidos integer := 0;
  v_descuento_cupon numeric(10, 2) := 0;
  v_descuento_puntos numeric(10, 2) := 0;
  v_descuento_total numeric(10, 2) := 0;
  v_codigo text;
  v_entrada_id bigint;
  v_entradas jsonb := '[]'::jsonb;
  v_butaca record;
BEGIN
  IF p_butacas_ids IS NULL OR cardinality(p_butacas_ids) = 0 THEN
    RAISE EXCEPTION 'Seleccioná al menos una butaca.';
  END IF;

  IF p_comprador_nombre IS NULL OR btrim(p_comprador_nombre) = ''
     OR p_comprador_email IS NULL OR position('@' IN p_comprador_email) = 0
     OR (v_usuario_id IS NULL AND (p_fecha_nacimiento IS NULL OR p_fecha_nacimiento > current_date)) THEN
    RAISE EXCEPTION 'Los datos del comprador son incompletos o inválidos.';
  END IF;

  v_fecha_nacimiento_validada := p_fecha_nacimiento;
  v_nombre_validado := btrim(p_comprador_nombre);
  v_email_validado := lower(btrim(p_comprador_email));

  IF v_usuario_id IS NOT NULL THEN
    SELECT perfil.fecha_nacimiento, perfil.nombre, perfil.email
    INTO v_fecha_nacimiento_validada, v_nombre_validado, v_email_validado
    FROM public.perfiles AS perfil
    WHERE perfil.id = v_usuario_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se encontró el perfil del usuario autenticado.';
    END IF;

    v_nombre_validado := coalesce(nullif(btrim(v_nombre_validado), ''), btrim(p_comprador_nombre));
    v_email_validado := coalesce(nullif(lower(btrim(v_email_validado)), ''), lower(btrim(p_comprador_email)));

    IF v_fecha_nacimiento_validada IS NULL THEN
      v_fecha_nacimiento_validada := p_fecha_nacimiento;
      IF v_fecha_nacimiento_validada IS NULL OR v_fecha_nacimiento_validada > current_date THEN
        RAISE EXCEPTION 'Ingresá una fecha de nacimiento válida para continuar.';
      END IF;

      UPDATE public.perfiles
      SET fecha_nacimiento = v_fecha_nacimiento_validada
      WHERE id = v_usuario_id
        AND fecha_nacimiento IS NULL;
    END IF;
  END IF;

  IF v_fecha_nacimiento_validada > current_date THEN
    RAISE EXCEPTION 'La fecha de nacimiento no puede ser futura.';
  END IF;

  IF v_usuario_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended(v_usuario_id::text || ':compra', 0)
    );
  END IF;

  SELECT count(DISTINCT seleccionado.butaca_id)
  INTO v_cantidad
  FROM unnest(p_butacas_ids) AS seleccionado(butaca_id);

  IF v_cantidad <> cardinality(p_butacas_ids) THEN
    RAISE EXCEPTION 'La selección contiene butacas duplicadas.';
  END IF;

  SELECT f.sala_id, f.fecha_hora_inicio, p.clasificacion::text,
         f.precio_base, f.precio_vip, f.precio_accesible
  INTO v_sala_id, v_inicio, v_clasificacion,
       v_precio_base, v_precio_vip, v_precio_accesible
  FROM public.funciones AS f
  JOIN public.peliculas AS p ON p.id = f.pelicula_id
  WHERE f.id = p_funcion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La función indicada no existe.';
  END IF;

  IF v_inicio <= now() THEN
    RAISE EXCEPTION 'No se pueden comprar entradas para una función iniciada.';
  END IF;

  v_edad := date_part('year', age(current_date, v_fecha_nacimiento_validada))::integer;
  IF (v_clasificacion = '+13' AND v_edad < 13)
     OR (v_clasificacion = '+18' AND v_edad < 18) THEN
    RAISE EXCEPTION 'La edad declarada no permite comprar entradas para esta película.';
  END IF;

  PERFORM 1
  FROM public.funcion_butacas AS fb
  WHERE fb.funcion_id = p_funcion_id
    AND fb.butaca_id = ANY(p_butacas_ids)
  ORDER BY fb.butaca_id
  FOR UPDATE;

  SELECT count(*)::integer,
         count(DISTINCT b.fila)::integer,
         min(b.numero),
         max(b.numero),
         coalesce(sum(coalesce(
           nullif(fb.precio_final, 0),
           CASE b.tipo::text
             WHEN 'vip' THEN v_precio_vip
             WHEN 'accesible' THEN v_precio_accesible
             ELSE v_precio_base
           END
         )), 0)
  INTO v_cantidad, v_filas, v_numero_minimo, v_numero_maximo, v_total
  FROM public.funcion_butacas AS fb
  JOIN public.butacas AS b ON b.id = fb.butaca_id
  WHERE fb.funcion_id = p_funcion_id
    AND b.sala_id = v_sala_id
    AND fb.butaca_id = ANY(p_butacas_ids);

  IF v_cantidad <> cardinality(p_butacas_ids) THEN
    RAISE EXCEPTION 'Una o más butacas no pertenecen a esta función.';
  END IF;

  SELECT count(*)::integer
  INTO v_disponibles
  FROM public.funcion_butacas AS fb
  WHERE fb.funcion_id = p_funcion_id
    AND fb.butaca_id = ANY(p_butacas_ids)
    AND fb.estado::text = 'disponible';

  IF v_disponibles <> cardinality(p_butacas_ids) THEN
    RAISE EXCEPTION 'Una o más butacas ya no están disponibles.';
  END IF;

  IF v_filas <> 1 OR v_numero_maximo - v_numero_minimo + 1 <> v_cantidad THEN
    RAISE EXCEPTION 'Las butacas deben ser contiguas y de una misma fila.';
  END IF;

  SELECT coalesce(cp.tasa_conversion, 1), coalesce(cp.valor_punto, 0)
  INTO v_tasa_puntos, v_valor_punto
  FROM public.configuracion_puntos AS cp
  WHERE cp.activo = true
  ORDER BY cp.actualizado_en DESC
  LIMIT 1;
  IF NOT FOUND THEN
    v_tasa_puntos := 1;
    v_valor_punto := 0;
  END IF;
  v_tasa_puntos := coalesce(v_tasa_puntos, 1);
  v_valor_punto := coalesce(v_valor_punto, 0);

  IF p_codigo_cupon IS NOT NULL AND btrim(p_codigo_cupon) <> '' THEN
    IF v_usuario_id IS NULL THEN
      RAISE EXCEPTION 'Los cupones requieren una cuenta registrada.';
    END IF;

    SELECT c.id, c.porcentaje_descuento, c.solo_mayores50, c.tipo::text
    INTO v_cupon_id, v_cupon_porcentaje, v_cupon_solo_mayores50, v_cupon_tipo
    FROM public.cupones AS c
    WHERE upper(c.codigo) = upper(btrim(p_codigo_cupon))
      AND c.activo = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El cupón no existe o está desactivado.';
    END IF;

    IF v_cupon_porcentaje < 0 OR v_cupon_porcentaje > 100 THEN
      RAISE EXCEPTION 'El porcentaje del cupón no es válido.';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.cupones AS c
      WHERE c.id = v_cupon_id
        AND ((c.valido_desde IS NOT NULL AND c.valido_desde > current_date)
          OR (c.valido_hasta IS NOT NULL AND c.valido_hasta < current_date))
    ) THEN
      RAISE EXCEPTION 'El cupón está fuera de su período de vigencia.';
    END IF;

    IF (v_cupon_solo_mayores50 OR v_cupon_tipo = 'mayor_50') AND v_edad <= 50 THEN
      RAISE EXCEPTION 'Este cupón es exclusivo para mayores de 50 años.';
    END IF;

    IF v_cupon_tipo = 'primera_compra' THEN
      PERFORM pg_advisory_xact_lock(
        hashtextextended(v_usuario_id::text || ':primera_compra', 0)
      );
      IF EXISTS (
        SELECT 1 FROM public.pedidos AS previo
        WHERE previo.usuario_id = v_usuario_id
          AND previo.estado::text IN ('confirmado', 'finalizado')
      ) THEN
        RAISE EXCEPTION 'El cupón de primera compra solo puede usarse una vez.';
      END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended(v_usuario_id::text || ':' || v_cupon_id::text, 0)
    );

    IF EXISTS (
      SELECT 1 FROM public.usuario_cupon AS uc
      WHERE uc.usuario_id = v_usuario_id
        AND uc.cupon_id = v_cupon_id
        AND uc.usado = true
    ) THEN
      RAISE EXCEPTION 'Ya utilizaste este cupón.';
    END IF;

    v_descuento_cupon := round(v_total * v_cupon_porcentaje / 100, 2);
  END IF;

  IF coalesce(p_puntos_a_usar, 0) < 0 THEN
    RAISE EXCEPTION 'La cantidad de puntos a canjear no puede ser negativa.';
  END IF;

  IF coalesce(p_puntos_a_usar, 0) > 0 THEN
    IF v_usuario_id IS NULL THEN
      RAISE EXCEPTION 'Los puntos requieren una cuenta registrada.';
    END IF;

    SELECT coalesce(pu.saldo, 0)
    INTO v_saldo_puntos
    FROM public.puntos_usuario AS pu
    WHERE pu.usuario_id = v_usuario_id
    FOR UPDATE;

    IF NOT FOUND OR p_puntos_a_usar > v_saldo_puntos THEN
      RAISE EXCEPTION 'No tenés saldo suficiente para ese canje.';
    END IF;

    IF v_valor_punto <= 0 THEN
      RAISE EXCEPTION 'El canje de puntos no está configurado.';
    END IF;

    v_descuento_puntos := round(p_puntos_a_usar * v_valor_punto, 2);
    IF v_descuento_cupon + v_descuento_puntos > v_total THEN
      RAISE EXCEPTION 'El descuento supera el importe de la compra.';
    END IF;
    v_puntos_usados := p_puntos_a_usar;
  END IF;

  v_descuento_total := v_descuento_cupon + v_descuento_puntos;
  v_total := v_total - v_descuento_total;
  IF v_usuario_id IS NOT NULL THEN
    v_puntos_obtenidos := floor(v_total * v_tasa_puntos)::integer;
  END IF;

  INSERT INTO public.pedidos (
    usuario_id, tipo_compra, subtotal, descuento_aplicado, total,
    puntos_usados, puntos_obtenidos, cupon_id, estado, es_anonimo,
    comprador_nombre, comprador_email, comprador_fecha_nacimiento
  )
  VALUES (
    v_usuario_id, 'entrada', v_total + v_descuento_total, v_descuento_total, v_total,
    v_puntos_usados, v_puntos_obtenidos, v_cupon_id, 'confirmado', v_usuario_id IS NULL,
    v_nombre_validado, v_email_validado, v_fecha_nacimiento_validada
  )
  RETURNING id INTO v_pedido_id;

  FOR v_butaca IN
    SELECT b.id AS butaca_id,
           coalesce(nullif(fb.precio_final, 0),
             CASE b.tipo::text
               WHEN 'vip' THEN v_precio_vip
               WHEN 'accesible' THEN v_precio_accesible
               ELSE v_precio_base
             END) AS precio
    FROM public.funcion_butacas AS fb
    JOIN public.butacas AS b ON b.id = fb.butaca_id
    WHERE fb.funcion_id = p_funcion_id
      AND fb.butaca_id = ANY(p_butacas_ids)
    ORDER BY b.fila, b.numero
  LOOP
    v_codigo := replace(pg_catalog.gen_random_uuid()::text, '-', '');

    INSERT INTO public.entradas (
      pedido_id, usuario_id, funcion_id, butaca_id, codigo_qr,
      estado, precio, requiere_acompanante
    )
    SELECT v_pedido_id, v_usuario_id, p_funcion_id, v_butaca.butaca_id,
           v_codigo, 'activa', v_butaca.precio,
           v_clasificacion IN ('+13', '+18')
    RETURNING id INTO v_entrada_id;

    v_entradas := v_entradas || jsonb_build_array(jsonb_build_object(
      'entradaId', v_entrada_id,
      'butacaId', v_butaca.butaca_id,
      'codigoQr', v_codigo,
      'precio', v_butaca.precio
    ));
  END LOOP;

  IF v_cupon_id IS NOT NULL THEN
    UPDATE public.usuario_cupon AS uc
    SET usado = true, usado_en = now()
    WHERE uc.usuario_id = v_usuario_id
      AND uc.cupon_id = v_cupon_id
      AND uc.usado = false;

    IF NOT FOUND THEN
      INSERT INTO public.usuario_cupon (usuario_id, cupon_id, usado, usado_en)
      VALUES (v_usuario_id, v_cupon_id, true, now());
    END IF;
  END IF;

  IF v_usuario_id IS NOT NULL AND (v_puntos_usados > 0 OR v_puntos_obtenidos > 0) THEN
    INSERT INTO public.puntos_usuario (
      usuario_id, saldo, total_acumulado, total_canjeado, actualizado_en
    )
    VALUES (
      v_usuario_id,
      v_puntos_obtenidos - v_puntos_usados,
      v_puntos_obtenidos,
      v_puntos_usados,
      now()
    )
    ON CONFLICT (usuario_id) DO UPDATE
    SET saldo = public.puntos_usuario.saldo + v_puntos_obtenidos - v_puntos_usados,
        total_acumulado = public.puntos_usuario.total_acumulado + v_puntos_obtenidos,
        total_canjeado = public.puntos_usuario.total_canjeado + v_puntos_usados,
        actualizado_en = now();

    IF v_puntos_usados > 0 THEN
      INSERT INTO public.movimientos_punto (usuario_id, tipo, cantidad, motivo, referencia)
      VALUES (v_usuario_id, 'canje', v_puntos_usados, 'Canje en compra de entradas', v_pedido_id::text);
    END IF;

    IF v_puntos_obtenidos > 0 THEN
      INSERT INTO public.movimientos_punto (usuario_id, tipo, cantidad, motivo, referencia)
      VALUES (v_usuario_id, 'acumulado', v_puntos_obtenidos, 'Compra de entradas', v_pedido_id::text);
    END IF;
  END IF;

  UPDATE public.funcion_butacas AS fb
  SET estado = 'vendida'
  WHERE fb.funcion_id = p_funcion_id
    AND fb.butaca_id = ANY(p_butacas_ids);

  RETURN jsonb_build_object(
    'pedidoId', v_pedido_id,
    'total', v_total,
    'descuentoAplicado', v_descuento_total,
    'puntosUsados', v_puntos_usados,
    'puntosObtenidos', v_puntos_obtenidos,
    'entradas', v_entradas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_compra_entradas(
  bigint, bigint[], text, text, date, text, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_compra_entradas(
  bigint, bigint[], text, text, date, text, integer
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';