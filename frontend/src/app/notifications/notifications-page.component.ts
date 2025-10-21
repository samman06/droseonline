import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        
        <!-- Header -->
        <div class="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
          <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
          
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span>🔔</span>
                <span>Notifications</span>
              </h1>
              <p class="text-indigo-100 text-lg">Stay updated with all your activities</p>
            </div>
            <div class="text-right">
              <p class="text-white text-3xl font-bold">{{ unreadCount }}</p>
              <p class="text-indigo-200 text-sm">Unread</p>
            </div>
          </div>
        </div>

        <!-- Filters and Actions -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <!-- Filter Type -->
              <select 
                [(ngModel)]="filters.type"
                (change)="applyFilters()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">All Types</option>
                <option value="announcement">📢 Announcements</option>
                <option value="assignment">📝 Assignments</option>
                <option value="grade">⭐ Grades</option>
                <option value="attendance">📋 Attendance</option>
                <option value="comment">💬 Comments</option>
                <option value="group">👥 Groups</option>
                <option value="message">✉️ Messages</option>
                <option value="system">⚙️ System</option>
              </select>

              <!-- Filter Status -->
              <select 
                [(ngModel)]="filters.unreadOnly"
                (change)="applyFilters()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option [ngValue]="false">All Notifications</option>
                <option [ngValue]="true">Unread Only</option>
              </select>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button 
                *ngIf="hasUnread"
                (click)="markAllAsRead()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Mark All Read
              </button>
              <button 
                (click)="refresh()"
                class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Refresh">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Loading State -->
          <div *ngIf="loading" class="p-8">
            <div class="animate-pulse space-y-4">
              <div *ngFor="let i of [1,2,3,4,5]" class="flex items-start gap-4">
                <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-200 rounded w-full"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading && notifications.length === 0" class="p-16 text-center">
            <svg class="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
            <p class="text-gray-500">{{ filters.unreadOnly ? "You're all caught up!" : "You have no notifications yet." }}</p>
          </div>

          <!-- Notifications -->
          <div *ngIf="!loading && notifications.length > 0" class="divide-y divide-gray-200">
            <div 
              *ngFor="let notification of notifications"
              class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              [class.bg-indigo-50]="!notification.read"
              (click)="handleNotificationClick(notification)">
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  <div 
                    [ngClass]="getColorClass(notification)"
                    class="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2">
                    {{ getIcon(notification) }}
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-semibold text-gray-900" [class.font-bold]="!notification.read">
                      {{ notification.title }}
                    </h3>
                    <span *ngIf="!notification.read" class="ml-3 flex-shrink-0 w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                  </div>
                  
                  <p class="text-gray-700 mb-2">{{ notification.message }}</p>
                  
                  <div class="flex items-center gap-4 text-sm">
                    <span class="text-gray-500">{{ notificationService.getTimeAgo(notification.createdAt) }}</span>
                    
                    <span 
                      *ngIf="notification.priority === 'urgent' || notification.priority === 'high'"
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-red-100 text-red-700': notification.priority === 'urgent',
                        'bg-orange-100 text-orange-700': notification.priority === 'high'
                      }">
                      {{ notification.priority | uppercase }}
                    </span>
                    
                    <span 
                      class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {{ notification.type | titlecase }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button 
                    *ngIf="!notification.read"
                    (click)="markAsRead($event, notification)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark as read">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="deleteNotification($event, notification)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="!loading && totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing {{ ((currentPage - 1) * filters.limit) + 1 }} to {{ Math.min(currentPage * filters.limit, totalNotifications) }} of {{ totalNotifications }} notifications
            </div>
            <div class="flex gap-2">
              <button 
                (click)="previousPage()"
                [disabled]="currentPage === 1"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <button 
                *ngFor="let page of getPageNumbers()"
                (click)="goToPage(page)"
                [class]="page === currentPage 
                  ? 'px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium'
                  : 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'">
                {{ page }}
              </button>
              <button 
                (click)="nextPage()"
                [disabled]="currentPage === totalPages"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  unreadCount = 0;
  hasUnread = false;
  Math = Math;

  filters = {
    page: 1,
    limit: 20,
    unreadOnly: false,
    type: ''
  };

  currentPage = 1;
  totalPages = 1;
  totalNotifications = 0;

  constructor(
    public notificationService: NotificationService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications(this.filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data.notifications;
          this.currentPage = response.data.pagination.page;
          this.totalPages = response.data.pagination.pages;
          this.totalNotifications = response.data.pagination.total;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.toastService.error('Failed to load notifications');
        this.loading = false;
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
      this.hasUnread = count > 0;
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadNotifications();
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.read = true;
        },
        error: (error) => console.error('Error marking as read:', error)
      });
    }

    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();
    
    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.read = true;
        this.toastService.success('Notification marked as read');
      },
      error: (error) => {
        console.error('Error marking as read:', error);
        this.toastService.error('Failed to mark as read');
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.toastService.success('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
        this.toastService.error('Failed to mark all as read');
      }
    });
  }

  deleteNotification(event: Event, notification: Notification): void {
    event.stopPropagation();
    
    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== notification._id);
        this.toastService.success('Notification deleted');
        if (this.notifications.length === 0 && this.currentPage > 1) {
          this.filters.page = this.currentPage - 1;
          this.loadNotifications();
        }
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.toastService.error('Failed to delete notification');
      }
    });
  }

  refresh(): void {
    this.loadNotifications();
    this.notificationService.refresh();
    this.toastService.info('Notifications refreshed');
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.filters.page = this.currentPage - 1;
      this.loadNotifications();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page = this.currentPage + 1;
      this.loadNotifications();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadNotifications();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - maxVisible + 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  getIcon(notification: Notification): string {
    return this.notificationService.getNotificationIcon(notification.type);
  }

  getColorClass(notification: Notification): string {
    return this.notificationService.getNotificationColorClass(
      notification.color || 'blue',
      notification.priority
    );
  }
}

