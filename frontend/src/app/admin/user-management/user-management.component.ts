import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AuthService, User, RegisterRequest } from '../../services/auth.service';
import { PasswordUtils } from '../../utils/password.util';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
        <p class="text-gray-600">Create and manage system users with secure password hashing</p>
      </div>

      <!-- Create User Form -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
          
          <form [formGroup]="createUserForm" (ngSubmit)="onCreateUser()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  formControlName="firstName"
                  class="form-input"
                  placeholder="Enter first name"
                />
                <div *ngIf="createUserForm.get('firstName')?.invalid && createUserForm.get('firstName')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  First name is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  formControlName="lastName"
                  class="form-input"
                  placeholder="Enter last name"
                />
                <div *ngIf="createUserForm.get('lastName')?.invalid && createUserForm.get('lastName')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Last name is required
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                formControlName="email"
                class="form-input"
                placeholder="Enter email address"
              />
              <div *ngIf="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="createUserForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="createUserForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select formControlName="role" class="form-input">
                <option value="">Select Role</option>
                <option value="admin">Administrator</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <div *ngIf="createUserForm.get('role')?.invalid && createUserForm.get('role')?.touched" 
                   class="mt-1 text-sm text-red-600">
                Role is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div class="space-y-2">
                <div class="relative">
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    class="form-input pr-10"
                    placeholder="Enter password"
                    (input)="checkPasswordStrength()"
                  />
                  <button
                    type="button"
                    (click)="togglePasswordVisibility()"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg *ngIf="!showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg *ngIf="showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M5.375 9.375c.621-.621 1.392-1.149 2.281-1.531"></path>
                    </svg>
                  </button>
                </div>

                <!-- Password Strength Indicator -->
                <div *ngIf="passwordStrength" class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        class="h-2 rounded-full transition-all duration-300"
                        [class]="getPasswordStrengthColor()"
                        [style.width.%]="passwordStrength.score"
                      ></div>
                    </div>
                    <span class="text-sm font-medium" [class]="getPasswordStrengthTextColor()">
                      {{ getPasswordStrengthText() }}
                    </span>
                  </div>
                  
                  <div *ngIf="passwordStrength.feedback.length > 0" class="text-sm text-gray-600">
                    <ul class="list-disc list-inside space-y-1">
                      <li *ngFor="let suggestion of passwordStrength.feedback">{{ suggestion }}</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  (click)="generateRandomPassword()"
                  class="text-sm text-blue-600 hover:text-blue-500"
                >
                  Generate Random Password
                </button>
              </div>
              
              <div *ngIf="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched" 
                   class="mt-1 text-sm text-red-600">
                Password must be at least 6 characters long
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                (click)="resetForm()"
                class="btn-secondary"
              >
                Reset
              </button>
              <button
                type="submit"
                [disabled]="createUserForm.invalid || isLoading"
                class="btn-primary"
              >
                <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isLoading ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>

          <!-- Success/Error Messages -->
          <div *ngIf="successMessage" class="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="errorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Hashing Demo -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Password Security Demo</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
              <input
                type="text"
                [(ngModel)]="testPassword"
                (input)="demonstrateHashing()"
                class="form-input"
                placeholder="Enter a password to see how it's hashed"
              />
            </div>

            <div *ngIf="testPassword" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Original Password</label>
                <div class="p-3 bg-gray-50 rounded border font-mono text-sm">
                  {{ testPassword }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hashed Password (What gets stored)</label>
                <div class="p-3 bg-gray-50 rounded border font-mono text-sm break-all">
                  {{ hashedTestPassword }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Verification Test</label>
                <div class="p-3 rounded border" [class]="verificationResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                  <div class="flex items-center">
                    <svg *ngIf="verificationResult" class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <svg *ngIf="!verificationResult" class="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span class="text-sm" [class]="verificationResult ? 'text-green-800' : 'text-red-800'">
                      {{ verificationResult ? 'Password verification successful!' : 'Password verification failed!' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  createUserForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  passwordStrength: any = null;
  
  // Demo variables
  testPassword = '';
  hashedTestPassword = '';
  verificationResult = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.createUserForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Component initialization
  }

  onCreateUser() {
    if (this.createUserForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData: RegisterRequest = {
        ...this.createUserForm.value
      };

      this.authService.createUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = `User ${userData.firstName} ${userData.lastName} created successfully!`;
            this.resetForm();
          } else {
            this.errorMessage = response.message || 'Failed to create user';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to create user. Please try again.';
        }
      });
    }
  }

  resetForm() {
    this.createUserForm.reset();
    this.passwordStrength = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength() {
    const password = this.createUserForm.get('password')?.value || '';
    if (password) {
      this.passwordStrength = PasswordUtils.checkPasswordStrength(password);
    } else {
      this.passwordStrength = null;
    }
  }

  generateRandomPassword() {
    const randomPassword = PasswordUtils.generatePassword(12);
    this.createUserForm.patchValue({ password: randomPassword });
    this.checkPasswordStrength();
  }

  getPasswordStrengthColor(): string {
    if (!this.passwordStrength) return 'bg-gray-300';
    
    if (this.passwordStrength.score >= 80) return 'bg-green-500';
    if (this.passwordStrength.score >= 60) return 'bg-yellow-500';
    if (this.passwordStrength.score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getPasswordStrengthTextColor(): string {
    if (!this.passwordStrength) return 'text-gray-500';
    
    if (this.passwordStrength.score >= 80) return 'text-green-700';
    if (this.passwordStrength.score >= 60) return 'text-yellow-700';
    if (this.passwordStrength.score >= 40) return 'text-orange-700';
    return 'text-red-700';
  }

  getPasswordStrengthText(): string {
    if (!this.passwordStrength) return '';
    
    if (this.passwordStrength.score >= 80) return 'Strong';
    if (this.passwordStrength.score >= 60) return 'Good';
    if (this.passwordStrength.score >= 40) return 'Fair';
    return 'Weak';
  }

  demonstrateHashing() {
    if (this.testPassword) {
      this.hashedTestPassword = PasswordUtils.hashPassword(this.testPassword);
      this.verificationResult = PasswordUtils.verifyPassword(this.testPassword, this.hashedTestPassword);
    } else {
      this.hashedTestPassword = '';
      this.verificationResult = false;
    }
  }
}
