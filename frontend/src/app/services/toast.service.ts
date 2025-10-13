import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private toastIdCounter = 0;

  constructor() {}

  /**
   * Get all active toasts as an observable
   */
  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  /**
   * Show a success toast
   */
  success(message: string, title?: string, duration: number = 5000): void {
    this.show({
      type: 'success',
      message,
      title: title || 'Success',
      duration,
      dismissible: true
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, title?: string, duration: number = 7000): void {
    this.show({
      type: 'error',
      message,
      title: title || 'Error',
      duration,
      dismissible: true
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, title?: string, duration: number = 6000): void {
    this.show({
      type: 'warning',
      message,
      title: title || 'Warning',
      duration,
      dismissible: true
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, title?: string, duration: number = 5000): void {
    this.show({
      type: 'info',
      message,
      title: title || 'Info',
      duration,
      dismissible: true
    });
  }

  /**
   * Show a custom toast with full control
   */
  show(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = {
      id,
      ...toast,
      dismissible: toast.dismissible ?? true,
      duration: toast.duration ?? 5000
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, newToast]);

    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter(t => t.id !== id));
  }

  /**
   * Dismiss all toasts
   */
  clear(): void {
    this.toasts$.next([]);
  }

  /**
   * Show a toast with an action button
   */
  showWithAction(
    type: Toast['type'],
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    title?: string,
    duration: number = 8000
  ): void {
    this.show({
      type,
      message,
      title: title || this.getDefaultTitle(type),
      duration,
      dismissible: true,
      action: {
        label: actionLabel,
        callback: actionCallback
      }
    });
  }

  /**
   * Show a persistent toast (doesn't auto-dismiss)
   */
  showPersistent(type: Toast['type'], message: string, title?: string): void {
    this.show({
      type,
      message,
      title: title || this.getDefaultTitle(type),
      duration: 0,
      dismissible: true
    });
  }

  /**
   * Show API error toast
   */
  showApiError(error: any): void {
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.error(message, 'Error');
  }

  /**
   * Show validation error toast
   */
  showValidationError(errors: string[] | string): void {
    const message = Array.isArray(errors) ? errors.join(', ') : errors;
    this.error(message, 'Validation Error');
  }

  /**
   * Show network error toast
   */
  showNetworkError(): void {
    this.error(
      'Unable to connect to the server. Please check your internet connection.',
      'Network Error',
      10000
    );
  }

  /**
   * Show unauthorized error toast
   */
  showUnauthorizedError(): void {
    this.error(
      'You are not authorized to perform this action.',
      'Unauthorized',
      7000
    );
  }

  /**
   * Show session expired toast
   */
  showSessionExpired(): void {
    this.warning(
      'Your session has expired. Please log in again.',
      'Session Expired',
      10000
    );
  }

  /**
   * Show save success toast
   */
  showSaveSuccess(itemName: string = 'Item'): void {
    this.success(`${itemName} saved successfully!`);
  }

  /**
   * Show delete success toast
   */
  showDeleteSuccess(itemName: string = 'Item'): void {
    this.success(`${itemName} deleted successfully!`);
  }

  /**
   * Show update success toast
   */
  showUpdateSuccess(itemName: string = 'Item'): void {
    this.success(`${itemName} updated successfully!`);
  }

  /**
   * Show create success toast
   */
  showCreateSuccess(itemName: string = 'Item'): void {
    this.success(`${itemName} created successfully!`);
  }

  /**
   * Show copy success toast
   */
  showCopySuccess(what: string = 'Content'): void {
    this.success(`${what} copied to clipboard!`, undefined, 3000);
  }

  /**
   * Show loading toast (persistent until dismissed)
   */
  showLoading(message: string = 'Loading...'): string {
    const id = this.generateId();
    const loadingToast: Toast = {
      id,
      type: 'info',
      message,
      title: 'Please wait',
      duration: 0,
      dismissible: false
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, loadingToast]);

    return id;
  }

  /**
   * Dismiss loading toast
   */
  dismissLoading(id: string): void {
    this.dismiss(id);
  }

  private generateId(): string {
    return `toast-${this.toastIdCounter++}-${Date.now()}`;
  }

  private getDefaultTitle(type: Toast['type']): string {
    const titles: Record<Toast['type'], string> = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    return titles[type];
  }
}

