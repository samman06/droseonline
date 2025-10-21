import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

export interface Notification {
  _id: string;
  recipient: string;
  type: 'announcement' | 'assignment' | 'grade' | 'attendance' | 'comment' | 'group' | 'message' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  metadata?: any;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar?: string;
  };
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  };
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private api: ApiService, private http: HttpClient) {
    // Load initial unread count
    this.loadUnreadCount();
  }

  /**
   * Get notifications with pagination and filters
   */
  getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Observable<NotificationResponse> {
    return this.api.get('notifications', params);
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.api.get('notifications/unread-count').pipe(
      tap((response: any) => {
        if (response.success && response.data) {
          this.unreadCountSubject.next(response.data.count);
        }
      })
    );
  }

  /**
   * Load unread count (called from constructor and periodically)
   */
  loadUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: () => {}, // Count is updated via tap in getUnreadCount
      error: (error) => console.error('Error loading unread count:', error)
    });
  }

  /**
   * Get single notification by ID
   */
  getNotification(id: string): Observable<any> {
    return this.api.get(`notifications/${id}`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): Observable<any> {
    return this.api.putWithoutId(`notifications/${id}/read`, {}).pipe(
      tap(() => {
        // Decrement unread count
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.api.putWithoutId('notifications/mark-all-read', {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(id: string): Observable<any> {
    return this.api.delete('notifications', id);
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): Observable<any> {
    // Custom endpoint without ID - use HTTP client directly
    const apiUrl = environment.production ? environment.apiBaseUrl : 'http://localhost:5000/api';
    return this.http.delete(`${apiUrl}/notifications/delete-all-read`);
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      announcement: '📢',
      assignment: '📝',
      grade: '⭐',
      attendance: '📋',
      comment: '💬',
      group: '👥',
      message: '✉️',
      system: '⚙️'
    };
    return icons[type] || '🔔';
  }

  /**
   * Get color class for notification
   */
  getNotificationColorClass(color: string, priority?: string): string {
    // Priority takes precedence
    if (priority === 'urgent') return 'bg-red-100 text-red-800 border-red-200';
    if (priority === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    
    // Default to color
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorClasses[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Format time ago
   */
  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  /**
   * Refresh notifications (call periodically)
   */
  refresh(): void {
    this.loadUnreadCount();
  }
}

