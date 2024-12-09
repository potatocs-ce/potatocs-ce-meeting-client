import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {


  const auth = inject(AuthService);
  const router = inject(Router);


  const routePath = route.routeConfig?.path;

  if (!auth.isAuthenticated()) {

    if (routePath == '' || routePath == 'sign-in' || routePath == 'sign-up') {

      return true;
    } else {
      // 
      router.navigate(['/sign-in'], { queryParams: { params: state.url } })
    }
  } else {
    if (routePath == '' || routePath == 'sign-in' || routePath == 'sign-up') {

      window.history.back()
    }
  }
  return true;
};
