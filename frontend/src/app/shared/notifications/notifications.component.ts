import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="w-96 max-h-[32rem] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          <button 
            (click)="markAllAsRead()"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            Mark all read
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ unreadCount }} unread notifications</p>
      </div>

      <!-- Notifications List -->
      <div class="overflow-y-auto max-h-96">
        <!-- Loading State -->
        <div *ngIf="loading" class="px-4 py-8">
          <div class="animate-pulse space-y-3">
            <div *ngFor="let i of [1,2,3,4,5]" class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-full"></div>
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && notifications.length === 0" class="px-4 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">No notifications yet</p>
          <p class="text-xs text-gray-400 mt-1">You're all caught up!</p>
        </div>

        <!-- Notifications List -->
        <div *ngFor="let notification of notifications" 
             class="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
             [class.bg-indigo-50]="!notification.read"
             (click)="handleNotificationClick(notification)">
          <div class="flex items-start space-x-3">
            <!-- Icon/Emoji -->
            <div class="flex-shrink-0 mt-1">
              <div [ngClass]="getColorClass(notification)" 
                   class="w-8 h-8 rounded-full flex items-center justify-center text-lg border">
                {{ getIcon(notification) }}
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <p class="text-sm font-semibold text-gray-900" [class.font-bold]="!notification.read">
                  {{ notification.title }}
                </p>
                <span *ngIf="!notification.read" class="ml-2 flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full"></span>
              </div>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ notification.message }}</p>
              <div class="flex items-center justify-between mt-1">
                <p class="text-xs text-gray-400">{{ notificationService.getTimeAgo(notification.createdAt) }}</p>
                <span *ngIf="notification.priority === 'urgent' || notification.priority === 'high'" 
                      class="text-xs px-2 py-0.5 rounded-full"
                      [ngClass]="{
                        'bg-red-100 text-red-700': notification.priority === 'urgent',
                        'bg-orange-100 text-orange-700': notification.priority === 'high'
                      }">
                  {{ notification.priority }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <button 
          (click)="viewAllNotifications()"
          class="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          View all notifications
        </button>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  notifications: Notification[] = [];
  loading = true;
  unreadCount = 0;

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
    this.notificationService.getNotifications({ limit: 10, unreadOnly: false }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data.notifications;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }

    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      this.close.emit();
      this.router.navigate([notification.actionUrl]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.toastService.success('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
        this.toastService.error('Failed to mark all as read');
      }
    });
  }

  viewAllNotifications(): void {
    this.close.emit();
    this.router.navigate(['/dashboard/notifications']);
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

