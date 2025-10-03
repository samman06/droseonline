import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new BehaviorSubject<ConfirmationConfig | null>(null);
  confirmation$ = this.confirmationSubject.asObservable();

  private resolveCallback: ((value: boolean) => void) | null = null;

  confirm(config: ConfirmationConfig): Promise<boolean> {
    this.confirmationSubject.next(config);
    
    return new Promise<boolean>((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  respond(confirmed: boolean): void {
    if (this.resolveCallback) {
      this.resolveCallback(confirmed);
      this.resolveCallback = null;
    }
    this.confirmationSubject.next(null);
  }

  close(): void {
    this.respond(false);
  }
}

