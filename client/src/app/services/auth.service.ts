import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3002/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      // Set user immediately from token to avoid race condition
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserSubject.next({ id: payload.userId, email: payload.email } as User);
      } catch (error) {
        console.warn('Failed to parse token payload:', error);
      }
      
      // Then fetch fresh user data
      this.getCurrentUser().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: (error) => {
          console.error('Failed to fetch current user:', error);
          if (error.status === 401) {
            this.logout();
          }
        }
      });
    } else {
      this.currentUserSubject.next(null);
    }
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    const errorMessage = error.error?.error || error.message || 'An error occurred';
    return throwError(() => ({ error: errorMessage }));
  }
}