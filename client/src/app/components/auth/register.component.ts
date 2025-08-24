import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-volleyball-orange">
            <span class="text-white text-2xl">🏐</span>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <a routerLink="/login" class="font-medium text-volleyball-orange hover:text-volleyball-orange">
              sign in to existing account
            </a>
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="first_name" class="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                formControlName="first_name"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
                placeholder="First Name"
              />
              <div *ngIf="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched" 
                   class="mt-1 text-sm text-red-600">
                First name is required
              </div>
            </div>

            <div>
              <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                formControlName="last_name"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
                placeholder="Last Name"
              />
              <div *ngIf="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched" 
                   class="mt-1 text-sm text-red-600">
                Last name is required
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                formControlName="email"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
                placeholder="Email address"
              />
              <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <div *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</div>
                <div *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</div>
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                formControlName="password"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
                placeholder="Password"
              />
              <div *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <div *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</div>
                <div *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</div>
              </div>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                formControlName="confirmPassword"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
                placeholder="Confirm Password"
              />
              <div *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <div *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</div>
                <div *ngIf="registerForm.hasError('passwordMismatch')">Passwords do not match</div>
              </div>
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="role"
                name="role"
                required
                formControlName="role"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-volleyball-orange focus:border-volleyball-orange sm:text-sm"
              >
                <option value="">Select a role</option>
                <option value="head_coach">Head Coach</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="player">Player</option>
                <option value="parent">Parent</option>
              </select>
              <div *ngIf="registerForm.get('role')?.invalid && registerForm.get('role')?.touched" 
                   class="mt-1 text-sm text-red-600">
                Please select a role
              </div>
            </div>
          </div>

          <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-800">{{ errorMessage }}</div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-volleyball-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-volleyball-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </span>
              {{ isLoading ? 'Creating account...' : 'Create account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = { ...this.registerForm.value };
      delete formData.confirmPassword; // Remove confirmPassword before sending

      this.authService.register(formData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessage = error.error || 'Registration failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
