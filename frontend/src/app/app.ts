import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/config.service';
import { ConfirmationModalComponent } from './shared/confirmation-modal/confirmation-modal.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HttpClientModule, 
    ConfirmationModalComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = signal('DroseOnline'); // Default value
  isLoading = false;

  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    // Set title from config after initialization
    this.title.set(this.configService.appName);
    
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
            localStorage.removeItem('userAvatar');
          }
        },
        error: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userAvatar');
        }
      });
    }
  }

  showLoading() {
    this.isLoading = true;
  }

  hideLoading() {
    this.isLoading = false;
  }
}