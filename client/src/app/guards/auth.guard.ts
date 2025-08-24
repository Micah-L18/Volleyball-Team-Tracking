import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | Observable<boolean> {
    // First check if we have a valid token synchronously
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // If no token or expired, check if we have a user from async loading
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isLoggedIn()) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
