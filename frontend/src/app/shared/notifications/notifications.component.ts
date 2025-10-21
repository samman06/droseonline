import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  icon?: string;
}

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
        <div *ngIf="notifications.length === 0" class="px-4 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">No notifications yet</p>
          <p class="text-xs text-gray-400 mt-1">You're all caught up!</p>
        </div>

        <div *ngFor="let notification of notifications" 
             class="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
             [class.bg-indigo-50]="!notification.read"
             (click)="markAsRead(notification)">
          <div class="flex items-start space-x-3">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-1">
              <div [ngClass]="getIconClasses(notification.type)" 
                   class="w-8 h-8 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path *ngIf="notification.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path *ngIf="notification.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path *ngIf="notification.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  <path *ngIf="notification.type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              <p class="text-xs text-gray-400 mt-1">{{ getTimeAgo(notification.timestamp) }}</p>
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
export class NotificationsComponent {
  @Output() close = new EventEmitter<void>();

  notifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Assignment Graded',
      message: 'Your assignment "Math Quiz #3" has been graded. You scored 95/100!',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false
    },
    {
      id: '2',
      type: 'info',
      title: 'New Assignment Posted',
      message: 'Your teacher has posted a new assignment "English Essay" due next Friday.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Attendance Alert',
      message: 'Your attendance rate is below 80%. Please ensure regular attendance.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: false
    },
    {
      id: '4',
      type: 'info',
      title: 'Group Session Scheduled',
      message: 'A new group session has been scheduled for tomorrow at 10:00 AM.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: true
    },
    {
      id: '5',
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true
    },
    {
      id: '6',
      type: 'info',
      title: 'Welcome!',
      message: 'Welcome to Drose Online! Complete your profile to get started.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      read: true
    }
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notification: Notification): void {
    notification.read = true;
    if (notification.link) {
      // Navigate to link if provided
      console.log('Navigate to:', notification.link);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  viewAllNotifications(): void {
    console.log('View all notifications');
    this.close.emit();
    // Navigate to notifications page if exists
  }

  getIconClasses(type: string): string {
    const classes = {
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  }
}

