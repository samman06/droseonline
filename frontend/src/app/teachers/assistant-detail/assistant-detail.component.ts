import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

interface Assistant {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  assistantInfo: {
    assignedTeacher: string;
    assignedDate: Date;
    permissions: string[];
  };
  createdAt: Date;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    assistant?: Assistant;
  };
}

@Component({
  selector: 'app-assistant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !assistant" class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <svg class="w-24 h-24 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-xl font-bold text-gray-900 mb-2">{{ 'assistants.notFound' | translate }}</h3>
          <p class="text-gray-600 mb-6">{{ 'assistants.notFoundMessage' | translate }}</p>
          <button routerLink="/dashboard/my-assistants"
                  class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ 'assistants.backToAssistants' | translate }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && assistant" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-6">
          <button routerLink="/dashboard/my-assistants"
                  class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ 'assistants.backToAssistants' | translate }}
          </button>
          <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900">{{ 'assistants.assistantDetails' | translate }}</h1>
            <button [routerLink]="['/dashboard/my-assistants/edit', assistant._id]"
                    class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ 'assistants.editAssistant' | translate }}
            </button>
          </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <!-- Header Section -->
          <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-white">
            <div class="flex items-center gap-6">
              <div class="relative">
                <div class="bg-white/20 p-2 rounded-full">
                  <img *ngIf="assistant.avatar" 
                       [src]="assistant.avatar" 
                       [alt]="assistant.fullName"
                       class="w-24 h-24 rounded-full object-cover border-4 border-white/30">
                  <svg *ngIf="!assistant.avatar" 
                       class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="absolute bottom-2 right-2 bg-white rounded-full p-1.5">
                  <div [class.bg-green-500]="assistant.isActive"
                       [class.bg-red-500]="!assistant.isActive"
                       class="w-4 h-4 rounded-full"></div>
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h2 class="text-3xl font-bold">{{ assistant.fullName }}</h2>
                  <span [class.bg-green-400]="assistant.isActive"
                        [class.bg-red-400]="!assistant.isActive"
                        class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ assistant.isActive ? ('assistants.active' | translate) : ('assistants.inactive' | translate) }}
                  </span>
                </div>
                <p class="text-blue-100 text-lg">{{ assistant.email }}</p>
                <p class="text-blue-200 text-sm mt-2">{{ 'assistants.joined' | translate }} {{ formatDate(assistant.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Details Section -->
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <!-- Contact Information -->
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  {{ 'assistants.contactInformation' | translate }}
                </h3>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.email' | translate }}</p>
                      <p class="text-gray-900">{{ assistant.email }}</p>
                    </div>
                  </div>
                  <div *ngIf="assistant.phoneNumber" class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.phone' | translate }}</p>
                      <p class="text-gray-900">{{ assistant.phoneNumber }}</p>
                    </div>
                  </div>
                  <div *ngIf="!assistant.phoneNumber" class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.phone' | translate }}</p>
                      <p class="text-gray-500 italic">{{ 'assistants.notProvided' | translate }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Account Information -->
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ 'assistants.accountInformation' | translate }}
                </h3>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.status' | translate }}</p>
                      <p [class.text-green-600]="assistant.isActive"
                         [class.text-red-600]="!assistant.isActive"
                         class="font-semibold">
                        {{ assistant.isActive ? ('assistants.active' | translate) : ('assistants.inactive' | translate) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.assignedDateLabel' | translate }}</p>
                      <p class="text-gray-900">{{ formatFullDate(assistant.assistantInfo.assignedDate) }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase">{{ 'assistants.created' | translate }}</p>
                      <p class="text-gray-900">{{ formatFullDate(assistant.createdAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Permissions Section -->
            <div class="border-t pt-8">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                {{ 'assistants.permissionsAccess' | translate }}
              </h3>
              
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p class="text-sm text-green-800 font-medium" [innerHTML]="'assistants.fullAccessMessage' | translate"></p>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.markAttendancePerm' | translate }}</span>
                </div>
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.manageAssignmentsPerm' | translate }}</span>
                </div>
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.manageMaterialsPerm' | translate }}</span>
                </div>
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.viewStudentsPerm' | translate }}</span>
                </div>
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.manageAnnouncementsPerm' | translate }}</span>
                </div>
                <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-900">{{ 'assistants.viewGradesPerm' | translate }}</span>
                </div>
              </div>
              
              <div class="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900 mb-1">{{ 'assistants.noAccountingAccessTitle' | translate }}</p>
                    <p class="text-sm text-gray-700">
                      {{ 'assistants.noAccountingAccessMessage' | translate }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="bg-gray-50 px-8 py-4 border-t flex items-center justify-between">
            <button routerLink="/dashboard/my-assistants"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              {{ 'assistants.backToList' | translate }}
            </button>
            <button [routerLink]="['/dashboard/my-assistants/edit', assistant._id]"
                    class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ 'assistants.editAssistant' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssistantDetailComponent implements OnInit {
  private readonly API_URL = environment.apiBaseUrl;
  
  assistant: Assistant | null = null;
  isLoading = false;
  assistantId: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.assistantId = this.route.snapshot.paramMap.get('id') || '';
    if (this.assistantId) {
      this.loadAssistant();
    }
  }

  loadAssistant() {
    this.isLoading = true;
    this.http.get<ApiResponse>(`${this.API_URL}/assistants/${this.assistantId}`).subscribe({
      next: (response) => {
        if (response.success && response.data.assistant) {
          this.assistant = response.data.assistant;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Load assistant error:', error);
        this.toastService.error(this.translate.instant('assistants.failedToLoadDetails'));
        this.isLoading = false;
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return this.translate.instant('assistants.today');
    if (diffDays === 1) return this.translate.instant('assistants.yesterday');
    if (diffDays < 7) return this.translate.instant('assistants.daysAgo', { count: diffDays });
    if (diffDays < 30) return this.translate.instant('assistants.weeksAgo', { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return this.translate.instant('assistants.monthsAgo', { count: Math.floor(diffDays / 30) });
    return this.translate.instant('assistants.yearsAgo', { count: Math.floor(diffDays / 365) });
  }

  formatFullDate(date: Date): string {
    const d = new Date(date);
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    return d.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatPermission(permission: string): string {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

