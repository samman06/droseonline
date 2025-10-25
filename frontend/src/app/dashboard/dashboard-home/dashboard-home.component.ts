import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  currentUser: User | null = null;
  stats: any = {};
  quickActions: any = {};
  isLoading = true;
  isLoadingQuickActions = false;
  currentTime = new Date();
  Math = Math;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    this.loadDashboardData();
    
    // Load quick actions for teachers
    if (this.currentUser?.role === 'teacher') {
      this.loadQuickActions();
    }
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  loadDashboardData() {
    this.isLoading = true;
    
    this.dashboardService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data?.stats || {};
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.toastService.error('Failed to load dashboard data');
        this.isLoading = false;
      }
    });
  }

  loadQuickActions() {
    this.isLoadingQuickActions = true;
    
    this.dashboardService.getQuickActions().subscribe({
      next: (response) => {
        if (response.success) {
          this.quickActions = response.data || {};
        }
        this.isLoadingQuickActions = false;
      },
      error: (error) => {
        console.error('Failed to load quick actions:', error);
        this.isLoadingQuickActions = false;
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getCurrentTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentDate(): string {
    return this.currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDueDate(date: string): string {
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  }

  getActivityTimeAgo(time: string): string {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  getAttendanceColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  getAttendanceBgColor(rate: number): string {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  getGradeColor(grade: number): string {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 75) return 'text-blue-600';
    if (grade >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
}
