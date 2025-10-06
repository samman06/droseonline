import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationConfig } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="config" class="fixed inset-0 z-50 overflow-y-auto" (click)="onBackdropClick($event)">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"></div>
      
      <!-- Modal -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
             (click)="$event.stopPropagation()">
          
          <!-- Icon -->
          <div class="flex items-center justify-center pt-8 pb-4">
            <div [ngClass]="{
              'bg-red-100': config.type === 'danger',
              'bg-yellow-100': config.type === 'warning',
              'bg-blue-100': config.type === 'info' || !config.type
            }" class="rounded-full p-4">
              <svg *ngIf="config.type === 'danger'" class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <svg *ngIf="config.type === 'warning'" class="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <svg *ngIf="config.type === 'info' || !config.type" class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          
          <!-- Content -->
          <div class="text-center px-8 pb-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-3">{{ config.title }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ config.message }}</p>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 px-8 pb-8">
            <button 
              (click)="onCancel()" 
              type="button"
              class="flex-1 px-6 py-3 text-sm font-semibold rounded-lg border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200">
              {{ config.cancelText || 'Cancel' }}
            </button>
            <button 
              (click)="onConfirm()" 
              type="button"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700 text-white': config.type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700 text-white': config.type === 'warning',
                'bg-blue-600 hover:bg-blue-700 text-white': !config.type || config.type === 'info'
              }"
              class="flex-1 px-6 py-3 text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              {{ config.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ConfirmationModalComponent implements OnInit {
  config: ConfirmationConfig | null = null;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.confirmationService.confirmation$.subscribe(config => {
      this.config = config;
    });
  }

  onConfirm(): void {
    this.confirmationService.respond(true);
  }

  onCancel(): void {
    this.confirmationService.respond(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

