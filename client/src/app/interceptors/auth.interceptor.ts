import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  console.log('=== AUTH INTERCEPTOR DEBUG ===');
  console.log('Request URL:', req.url);
  console.log('Token exists:', !!token);
  console.log('Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
  console.log('LocalStorage token:', localStorage.getItem('token') ? 'exists' : 'missing');
  
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('No token available - proceeding without auth header');
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('=== HTTP ERROR ===');
      console.log('Status:', error.status);
      console.log('Error message:', error.error);
      console.log('Request URL:', error.url);
      
      if (error.status === 401) {
        console.log('401 Unauthorized - logging out user');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
