import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { ConfirmationModalComponent } from './shared/confirmation-modal/confirmation-modal.component';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  show: boolean;
  duration?: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HttpClientModule, ConfirmationModalComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = signal('Drose Online');
  isLoading = false;
  toasts: Toast[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Initialize app, check authentication status
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.validateToken().subscribe({
        next: (response) => {
          if (!response.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        },
        error: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      });
    }
  }

  showToast(type: Toast['type'], title: string, message?: string, duration = 5000) {
    const toast: Toast = {
      id: Date.now().toString(),
      type,
      title,
      message,
      show: true,
      duration
    };

    this.toasts.push(toast);

    // Auto dismiss after duration
    setTimeout(() => {
      this.dismissToast(toast);
    }, duration);
  }

  dismissToast(toast: Toast) {
    toast.show = false;
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== toast.id);
    }, 300);
  }

  showLoading() {
    this.isLoading = true;
  }

  hideLoading() {
    this.isLoading = false;
  }
}