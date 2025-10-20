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
              'bg-green-100': config.type === 'success',
              'bg-blue-100': config.type === 'info' || !config.type
            }" class="rounded-full p-4 animate-pulse">
              <!-- Danger Icon (Leave/Delete) -->
              <svg *ngIf="config.type === 'danger'" class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <!-- Warning Icon -->
              <svg *ngIf="config.type === 'warning'" class="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <!-- Success Icon (Join/Add) -->
              <svg *ngIf="config.type === 'success'" class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <!-- Info Icon -->
              <svg *ngIf="config.type === 'info' || !config.type" class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          
          <!-- Content -->
          <div class="text-center px-8 pb-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-3">{{ config.title }}</h3>
            <p class="text-gray-600 leading-relaxed whitespace-pre-line text-left" [innerHTML]="config.message"></p>
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
                'bg-red-600 hover:bg-red-700 text-white border-red-600': config.type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600': config.type === 'warning',
                'bg-green-600 hover:bg-green-700 text-white border-green-600': config.type === 'success',
                'bg-blue-600 hover:bg-blue-700 text-white border-blue-600': !config.type || config.type === 'info'
              }"
              class="flex-1 px-6 py-3 text-sm font-semibold rounded-lg border-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
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

