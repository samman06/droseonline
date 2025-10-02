import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome to Drose Online</h2>
          <p class="text-gray-600">Educational Management System</p>
        </div>

        <!-- Login Form -->
        <div class="card animate-slide-up">
          <div class="card-body">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div>
                <label for="email" class="form-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-input"
                  [class.border-red-300]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  placeholder="Enter your email"
                >
                <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                  <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</span>
                </div>
              </div>

              <div>
                <label for="password" class="form-label">Password</label>
                <div class="relative">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    class="form-input pr-10"
                    [class.border-red-300]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                    placeholder="Enter your password"
                  >
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    (click)="togglePasswordVisibility()"
                  >
                    <svg *ngIf="!showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg *ngIf="showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  </button>
                </div>
                <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
                  <span *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
                </div>
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="ml-3">
                    <p class="text-sm text-red-800">{{ errorMessage }}</p>
                  </div>
                </div>
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input id="remember-me" type="checkbox" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                  <label for="remember-me" class="ml-2 block text-sm text-gray-900">Remember me</label>
                </div>
                <div class="text-sm">
                  <a href="#" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <!-- Submit Button -->
              <div>
                <button
                  type="submit"
                  [disabled]="loginForm.invalid || isLoading"
                  class="btn-primary w-full flex justify-center py-3"
                >
                  <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account? 
            <a routerLink="/auth/register" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.router.navigate([this.returnUrl]);
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    }
  }
}
