import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  demoCredentials = [
    {
      category: 'Administrators',
      icon: '👤',
      users: [
        { email: 'admin@droseonline.com', password: 'password123', name: 'System Administrator', role: 'admin' },
        { email: 'test@admin.com', password: 'password123', name: 'Test Admin', role: 'admin' },
      ]
    },
    {
      category: 'Teachers',
      icon: '👨‍🏫',
      users: [
        { email: 'sarah.johnson@droseonline.com', password: 'password123', name: 'Dr. Sarah Johnson', role: 'teacher' },
        { email: 'michael.davis@droseonline.com', password: 'password123', name: 'Prof. Michael Davis', role: 'teacher' },
        { email: 'emily.wilson@droseonline.com', password: 'password123', name: 'Dr. Emily Wilson', role: 'teacher' },
      ]
    },
    {
      category: 'Students',
      icon: '👨‍🎓',
      users: [
        { email: 'emma.wilson@student.droseonline.com', password: 'password123', name: 'Emma Wilson', role: 'student' },
        { email: 'daniel.martinez0@student.droseonline.com', password: 'password123', name: 'Daniel Martinez', role: 'student' },
        { email: 'joshua.clark1@student.droseonline.com', password: 'password123', name: 'Joshua Clark', role: 'student' },
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated) {
      this.redirectToDashboard();
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.redirectToDashboard();
          } else {
            this.errorMessage = response.message || 'Login failed';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  fillDemoCredentials(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private redirectToDashboard() {
    const user = this.authService.currentUser;
    if (user) {
      switch (user.role) {
        case 'admin':
          this.router.navigate(['/dashboard']);
          break;
        case 'teacher':
          this.router.navigate(['/dashboard']);
          break;
        case 'student':
          this.router.navigate(['/dashboard']);
          break;
        default:
          this.router.navigate(['/dashboard']);
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getter methods for form validation
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}