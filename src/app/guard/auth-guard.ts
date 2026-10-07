import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
 
export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);   // guards funcionales: inyección normal (libro 20.6)
  const router = inject(Router);

  await auth.initialized;
  return auth.session() ? true : router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialized;
  return auth.session() ? router.parseUrl('/board') : true;
};
