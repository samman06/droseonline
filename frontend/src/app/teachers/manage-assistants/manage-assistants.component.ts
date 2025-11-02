import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

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
    assistants?: Assistant[];
    assistant?: Assistant;
  };
}

@Component({
  selector: 'app-manage-assistants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">👥 {{ 'assistants.manageAssistants' | translate }}</h1>
              <p class="mt-1 text-sm text-gray-500">{{ 'assistants.subtitle' | translate }}</p>
            </div>
            <button (click)="showAddModal = true"
                    class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ 'assistants.addAssistant' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && assistants.length === 0" class="text-center py-12">
          <div class="bg-white rounded-2xl shadow-lg p-12">
            <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ 'assistants.noAssistantsYet' | translate }}</h3>
            <p class="text-gray-600 mb-6">{{ 'assistants.noAssistantsMessage' | translate }}</p>
            <button (click)="showAddModal = true"
                    class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {{ 'assistants.addFirstAssistant' | translate }}
            </button>
          </div>
        </div>

        <!-- Assistants Grid -->
        <div *ngIf="!isLoading && assistants.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let assistant of assistants" 
               class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-200">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="relative">
                  <div class="bg-white/20 p-3 rounded-full">
                    <img *ngIf="assistant.avatar" 
                         [src]="assistant.avatar" 
                         [alt]="assistant.fullName"
                         class="w-12 h-12 rounded-full object-cover">
                    <svg *ngIf="!assistant.avatar" 
                         class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div class="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                    <div [class.bg-green-500]="assistant.isActive"
                         [class.bg-red-500]="!assistant.isActive"
                         class="w-3 h-3 rounded-full"></div>
                  </div>
                </div>
                <span [class.bg-green-500]="assistant.isActive"
                      [class.bg-red-500]="!assistant.isActive"
                      class="px-3 py-1 rounded-full text-xs font-semibold">
                  {{ assistant.isActive ? ('assistants.active' | translate) : ('assistants.inactive' | translate) }}
                </span>
              </div>
              <h3 class="text-xl font-bold">{{ assistant.fullName }}</h3>
              <p class="text-blue-100 text-sm mt-1">{{ assistant.email }}</p>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
              <!-- Phone -->
              <div *ngIf="assistant.phoneNumber" class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span class="text-sm text-gray-600">{{ assistant.phoneNumber }}</span>
              </div>

              <!-- Assigned Date -->
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="text-sm text-gray-600">{{ 'assistants.assignedDate' | translate }} {{ formatDate(assistant.assistantInfo.assignedDate) }}</span>
              </div>

              <!-- Permissions -->
              <div class="pt-4 border-t">
                <p class="text-xs font-semibold text-gray-500 mb-2">{{ 'assistants.accessLevel' | translate }}</p>
                <div class="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-xs font-semibold text-green-800">{{ 'assistants.fullTeachingAccess' | translate }}</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">{{ 'assistants.fullAccessNote' | translate }}</p>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button (click)="viewAssistant(assistant)"
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {{ 'assistants.view' | translate }}
                </button>
                <button (click)="editAssistant(assistant)"
                        class="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  {{ 'assistants.edit' | translate }}
                </button>
              </div>
              <button (click)="confirmRemoveAssistant(assistant)"
                      class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                {{ 'assistants.remove' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- {{ 'assistants.addAssistant' | translate }} Modal -->
    <div *ngIf="showAddModal"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         (click)="closeAddModal()">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
           (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-white">{{ 'assistants.addNewAssistant' | translate }}</h2>
              <p class="text-blue-100 text-sm mt-1">{{ 'assistants.createAccount' | translate }}</p>
            </div>
            <button (click)="closeAddModal()"
                    class="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                {{ 'assistants.firstName' | translate }} <span class="text-red-500">*</span>
              </label>
              <input type="text" 
                     [(ngModel)]="newAssistant.firstName"
                     placeholder="{{ 'assistants.enterFirstName' | translate }}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                {{ 'assistants.lastName' | translate }} <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     [(ngModel)]="newAssistant.lastName"
                     placeholder="{{ 'assistants.enterLastName' | translate }}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ 'assistants.email' | translate }} <span class="text-red-500">*</span>
            </label>
            <input type="email"
                   [(ngModel)]="newAssistant.email"
                   placeholder="{{ 'assistants.enterEmail' | translate }}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ 'assistants.phoneNumber' | translate }} <span class="text-gray-400 text-xs">{{ 'assistants.optional' | translate }}</span>
            </label>
            <input type="tel"
                   [(ngModel)]="newAssistant.phoneNumber"
                   placeholder="{{ 'assistants.enterPhone' | translate }}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ 'assistants.password' | translate }} <span class="text-red-500">*</span>
            </label>
            <input type="password"
                   [(ngModel)]="newAssistant.password"
                   placeholder="{{ 'assistants.enterPassword' | translate }}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <p class="text-xs text-gray-500 mt-1">{{ 'assistants.passwordMinLength' | translate }}</p>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <p class="font-semibold text-gray-900 mb-1">{{ 'assistants.whatCanDo' | translate }}</p>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>{{ 'assistants.canMarkAttendance' | translate }}</li>
                  <li>{{ 'assistants.canManageAssignments' | translate }}</li>
                  <li>{{ 'assistants.canManageMaterials' | translate }}</li>
                  <li>{{ 'assistants.canViewStudents' | translate }}</li>
                  <li>{{ 'assistants.cannotAccounting' | translate }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3 border-t">
          <button (click)="closeAddModal()"
                  [disabled]="isSaving"
                  class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
            {{ 'assistants.cancel' | translate }}
          </button>
          <button (click)="addAssistant()"
                  [disabled]="!isFormValid() || isSaving"
                  class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg *ngIf="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span *ngIf="!isSaving">{{ 'assistants.addAssistant' | translate }}</span>
            <span *ngIf="isSaving">{{ 'assistants.adding' | translate }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- {{ 'assistants.remove' | translate }} Confirmation Modal -->
    <div *ngIf="showRemoveModal"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         (click)="closeRemoveModal()">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
           (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-red-100 p-3 rounded-full">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">{{ 'assistants.removeTitle' | translate }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ 'assistants.removeSubtitle' | translate }}</p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-gray-700" [innerHTML]="'assistants.removeConfirmText' | translate: { name: assistantToRemove?.fullName }"></p>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button (click)="closeRemoveModal()"
                    [disabled]="isRemoving"
                    class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
              {{ 'assistants.cancel' | translate }}
            </button>
            <button (click)="removeAssistant()"
                    [disabled]="isRemoving"
                    class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
              <svg *ngIf="isRemoving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span *ngIf="!isRemoving">{{ 'assistants.removeAssistant' | translate }}</span>
              <span *ngIf="isRemoving">{{ 'assistants.removing' | translate }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManageAssistantsComponent implements OnInit {
  private readonly API_URL = environment.apiBaseUrl;
  
  assistants: Assistant[] = [];
  isLoading = false;
  isSaving = false;
  isRemoving = false;
  
  showAddModal = false;
  showRemoveModal = false;
  assistantToRemove: Assistant | null = null;
  
  newAssistant = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: ''
  };

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadAssistants();
  }

  loadAssistants() {
    this.isLoading = true;
    this.http.get<ApiResponse>(`${this.API_URL}/assistants`).subscribe({
      next: (response) => {
        if (response.success && response.data.assistants) {
          this.assistants = response.data.assistants;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Load assistants error:', error);
        this.toastService.error(this.translate.instant('assistants.failedToLoad'));
        this.isLoading = false;
      }
    });
  }

  addAssistant() {
    if (!this.isFormValid()) return;

    this.isSaving = true;
    this.http.post<ApiResponse>(`${this.API_URL}/assistants`, this.newAssistant).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assistants.addedSuccess'));
          this.loadAssistants();
          this.closeAddModal();
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Add assistant error:', error);
        this.toastService.error(error.error?.message || this.translate.instant('assistants.failedToAdd'));
        this.isSaving = false;
      }
    });
  }

  confirmRemoveAssistant(assistant: Assistant) {
    this.assistantToRemove = assistant;
    this.showRemoveModal = true;
  }

  removeAssistant() {
    if (!this.assistantToRemove) return;

    this.isRemoving = true;
    this.http.delete<ApiResponse>(`${this.API_URL}/assistants/${this.assistantToRemove._id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assistants.removedSuccess'));
          this.loadAssistants();
          this.closeRemoveModal();
        }
        this.isRemoving = false;
      },
      error: (error) => {
        console.error(this.translate.instant('assistants.remove'), 'assistant error:', error);
        this.toastService.error(this.translate.instant('assistants.failedToRemove'));
        this.isRemoving = false;
      }
    });
  }

  viewAssistant(assistant: Assistant) {
    this.router.navigate(['/dashboard/my-assistants', assistant._id]);
  }

  editAssistant(assistant: Assistant) {
    this.router.navigate(['/dashboard/my-assistants/edit', assistant._id]);
  }

  isFormValid(): boolean {
    return !!(
      this.newAssistant.firstName.trim() &&
      this.newAssistant.lastName.trim() &&
      this.newAssistant.email.trim() &&
      this.newAssistant.password.trim() &&
      this.newAssistant.password.length >= 6
    );
  }

  closeAddModal() {
    this.showAddModal = false;
    this.newAssistant = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: ''
    };
  }

  closeRemoveModal() {
    this.showRemoveModal = false;
    this.assistantToRemove = null;
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

  formatPermission(permission: string): string {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

