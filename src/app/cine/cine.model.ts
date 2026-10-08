export type RolUsuario = 'cliente' | 'empleado' | 'administrador';
export type ClasificacionEdad = 'ATP' | '+13' | '+18';
export type TipoButaca = 'estandar' | 'accesible' | 'vip';
export type EstadoButaca = 'disponible' | 'reservada' | 'vendida' | 'procesando';
export type TipoCompra = 'entrada' | 'candy' | 'mixto';
export type EstadoPedido = 'pendiente' | 'confirmado' | 'cancelado' | 'finalizado';
export type EstadoEntrada = 'activa' | 'usada' | 'cancelada';
export type TipoCupon = 'primera_compra' | 'mayor_50' | 'general' | 'personalizado';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  fechaNacimiento?: string | null;
  tipoSangre?: string | null;
  colorOjos?: string | null;
  diasVacaciones: number;
  rol: RolUsuario;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Pelicula {
  id: number;
  titulo: string;
  sinopsis?: string | null;
  duracionMinutos: number;
  genero: string;
  clasificacion: ClasificacionEdad;
  trailerUrl?: string | null;
  posterUrl?: string | null;
  fechaEstreno?: string | null;
  activa: boolean;
  esProximamente: boolean;
  valoracionPromedio: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Sala {
  id: number;
  codigoLetra: string;
  filasTotal: number;
  columnasTotal: number;
  descripcion?: string | null;
  activa: boolean;
  creadoEn: string;
}

export interface Funcion {
  id: number;
  peliculaId: number;
  salaId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioBase: number;
  precioVip: number;
  precioAccesible: number;
  creadaEn: string;
}

export interface Butaca {
  id: number;
  salaId: number;
  fila: string;
  numero: number;
  tipo: TipoButaca;
  precio: number;
}

export interface FuncionButaca {
  id: number;
  funcionId: number;
  butacaId: number;
  estado: EstadoButaca;
  precioFinal: number;
}

export interface Cupon {
  id: number;
  codigo: string;
  descripcion?: string | null;
  porcentajeDescuento: number;
  tipo: TipoCupon;
  activo: boolean;
  validoDesde?: string | null;
  validoHasta?: string | null;
  soloMayores50: boolean;
  creadoEn: string;
}

export interface UsuarioCupon {
  id: number;
  usuarioId: string;
  cuponId: number;
  usado: boolean;
  usadoEn?: string | null;
  creadoEn: string;
}

export interface ConfiguracionPuntos {
  id: number;
  tasaConversion: number;
  valorPunto: number;
  activo: boolean;
  actualizadoEn: string;
}

export interface PuntosUsuario {
  id: number;
  usuarioId: string;
  saldo: number;
  totalAcumulado: number;
  totalCanjeado: number;
  actualizadoEn: string;
}

export interface MovimientoPunto {
  id: number;
  usuarioId: string;
  tipo: 'acumulado' | 'canje' | 'ajuste' | 'reembolso';
  cantidad: number;
  motivo?: string | null;
  referencia?: string | null;
  creadoEn: string;
}

export interface Pedido {
  id: number;
  usuarioId?: string | null;
  tipoCompra: TipoCompra;
  subtotal: number;
  descuentoAplicado: number;
  total: number;
  puntosUsados: number;
  puntosObtenidos: number;
  cuponId?: number | null;
  estado: EstadoPedido;
  esAnonimo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Entrada {
  id: number;
  pedidoId: number;
  usuarioId?: string | null;
  funcionId: number;
  butacaId: number;
  codigoQr: string;
  estado: EstadoEntrada;
  precio: number;
  requiereAcompanante: boolean;
  creadaEn: string;
  usadaEn?: string | null;
}

export interface CategoriaCandy {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string;
}

export interface ProductoCandy {
  id: number;
  categoriaId: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
  imagenUrl?: string | null;
  creadoEn: string;
}

export interface PedidoCandy {
  id: number;
  pedidoId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  qrRetiro?: string | null;
  entregado: boolean;
  creadoEn: string;
}

export interface Resena {
  id: number;
  peliculaId: number;
  usuarioId: string;
  estrellas: number;
  comentario?: string | null;
  creadoEn: string;
}

export interface Notificacion {
  id: number;
  usuarioId: string;
  tipo: 'funcion' | 'estreno' | 'validacion' | 'alerta';
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadaEn: string;
}

export interface Auditoria {
  id: number;
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  detalle?: Record<string, unknown> | null;
  creadoEn: string;
}

export type PeliculaDraft = Omit<Pelicula, 'id' | 'creadoEn' | 'actualizadoEn' | 'valoracionPromedio'>;
export type FuncionDraft = Omit<Funcion, 'id' | 'creadaEn'>;
export type PedidoDraft = Omit<Pedido, 'id' | 'creadoEn' | 'actualizadoEn'>;

export function crearPerfilVacio(): Omit<PerfilUsuario, 'id' | 'email' | 'creadoEn' | 'actualizadoEn'> {
  return {
    nombre: '',
    fechaNacimiento: null,
    tipoSangre: null,
    colorOjos: null,
    diasVacaciones: 0,
    rol: 'cliente',
  };
}

export function crearPeliculaVacia(): PeliculaDraft {
  return {
    titulo: '',
    sinopsis: '',
    duracionMinutos: 90,
    genero: '',
    clasificacion: 'ATP',
    trailerUrl: '',
    posterUrl: '',
    fechaEstreno: null,
    activa: true,
    esProximamente: false,
    valoracionPromedio: 0,
    actualizadoEn: new Date().toISOString(),
    creadoEn: new Date().toISOString(),
  } as PeliculaDraft;
}

export function crearSalaVacia(): Omit<Sala, 'id' | 'creadoEn'> {
  return {
    codigoLetra: 'A',
    filasTotal: 20,
    columnasTotal: 3,
    descripcion: '',
    activa: true,
  };
}

export function crearFuncionVacia(): FuncionDraft {
  return {
    peliculaId: 0,
    salaId: 0,
    fechaHoraInicio: new Date().toISOString(),
    fechaHoraFin: new Date().toISOString(),
    precioBase: 0,
    precioVip: 0,
    precioAccesible: 0,
  };
}

export function esButacaAccesible(fila: string): boolean {
  return fila === 'J' || fila === 'K';
}

export function esButacaVip(fila: string): boolean {
  return fila === 'R' || fila === 'S' || fila === 'T';
}

export function clasificacionPermiteEdad(clasificacion: ClasificacionEdad): number {
  switch (clasificacion) {
    case 'ATP':
      return 0;
    case '+13':
      return 13;
    case '+18':
      return 18;
    default:
      return 0;
  }
}
