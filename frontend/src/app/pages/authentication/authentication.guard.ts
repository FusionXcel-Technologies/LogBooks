import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuard implements CanActivate {

  constructor(private authService: AuthenticationService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const isLoggedIn = this.authService.isLoggedIn();
    const currentRoute = state.url;
    const SIGNIN_ROUTE = '/signin';
    const SIGNUP_ROUTE = '/signup';
    const HOME_ROUTE = '/home';
    const UNAUTHORIZED_ROUTE = '/unauthorized';

    const redirectToAvailablePermission = (): Observable<boolean> => {
      return this.authService.getUserPermissions().pipe(
        tap((availablePermissions: string[]) => {
          console.log('Available Permissions: --------------------------- ', availablePermissions);

          // Check if the first permission is not 'signin' or 'signup' to prevent redirection to these routes
          if (availablePermissions.length > 0 && availablePermissions[0] !== 'signin' && availablePermissions[1] !== 'signup') {
            console.log('User lacks permission, redirecting to:', availablePermissions[0]);
            this.router.navigate([`/${availablePermissions[0]}`]);
          } else {
            console.log('No available permissions found for redirection');
            this.router.navigate([UNAUTHORIZED_ROUTE]);
          }
        }),
        map(() => false) // Ensure the function returns a boolean
      );
    };


    console.log('User logged in status:', isLoggedIn);

    // Redirect if logged in and trying to access sign-in or sign-up
    if (isLoggedIn && (currentRoute === SIGNIN_ROUTE || currentRoute === SIGNUP_ROUTE)) {
      console.log('Redirecting logged-in user to home from sign-in/sign-up');

      return redirectToAvailablePermission();
    }

    // Redirect if not logged in and trying to access protected routes
    if (!isLoggedIn && currentRoute !== SIGNIN_ROUTE && currentRoute !== SIGNUP_ROUTE) {
      console.log('Redirecting to sign-in as user is not logged in');
      this.router.navigate([SIGNIN_ROUTE]);
      return of(false);
    }

    // Get required permission from the current route
    const requiredPermission = currentRoute.replace(/^\//, '');
    console.log('Required Permission:', requiredPermission);

    // Check permissions
    return this.authService.hasPermission(requiredPermission).pipe(
      switchMap((hasPerm: boolean) => {
        if (!hasPerm) {
          return redirectToAvailablePermission();
        }
        console.log('User has permission, access granted');
        return of(true); // Allow access if authorized
      }),
      catchError(() => {
        console.log('Error checking permissions, redirecting to unauthorized page');
        this.router.navigate([UNAUTHORIZED_ROUTE]);
        return of(false);
      })
    );
  }


}
