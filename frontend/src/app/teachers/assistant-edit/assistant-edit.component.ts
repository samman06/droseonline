import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-assistant-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
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
          <p class="text-gray-600 mb-6">{{ 'assistants.notFoundEditMessage' | translate }}</p>
          <button routerLink="/dashboard/my-assistants"
                  class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ 'assistants.backToAssistants' | translate }}
          </button>
        </div>
      </div>

      <!-- Edit Form -->
      <div *ngIf="!isLoading && assistant" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-6">
          <button [routerLink]="['/dashboard/my-assistants', assistantId]"
                  class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ 'assistants.backToDetails' | translate }}
          </button>
          <h1 class="text-3xl font-bold text-gray-900">{{ 'assistants.editAssistantTitle' | translate }}</h1>
          <p class="text-gray-600 mt-2">{{ 'assistants.editAssistantSubtitle' | translate }}</p>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <!-- Form Header -->
          <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="bg-white/20 p-2 rounded-full">
                  <img *ngIf="editForm.avatar" 
                       [src]="editForm.avatar" 
                       [alt]="editForm.firstName + ' ' + editForm.lastName"
                       class="w-16 h-16 rounded-full object-cover border-2 border-white/30">
                  <svg *ngIf="!editForm.avatar" 
                       class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <button type="button"
                        (click)="fileInput.click()"
                        class="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <input #fileInput
                       type="file"
                       accept="image/*"
                       (change)="onAvatarChange($event)"
                       class="hidden">
              </div>
              <div>
                <h2 class="text-xl font-bold">{{ editForm.firstName }} {{ editForm.lastName }}</h2>
                <p class="text-blue-100 text-sm">{{ editForm.email }}</p>
              </div>
            </div>
          </div>

          <!-- Form Body -->
          <div class="p-8 space-y-6">
            <!-- Basic Information -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                {{ 'assistants.basicInformation' | translate }}
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ 'assistants.firstName' | translate }} <span class="text-red-500">*</span>
                  </label>
                  <input type="text" 
                         [(ngModel)]="editForm.firstName"
                         placeholder="{{ 'assistants.enterFirstName' | translate }}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ 'assistants.lastName' | translate }} <span class="text-red-500">*</span>
                  </label>
                  <input type="text"
                         [(ngModel)]="editForm.lastName"
                         placeholder="{{ 'assistants.enterLastName' | translate }}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {{ 'assistants.contactInformation' | translate }}
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ 'assistants.email' | translate }} <span class="text-red-500">*</span>
                  </label>
                  <input type="email"
                         [(ngModel)]="editForm.email"
                         placeholder="{{ 'assistants.enterEmail' | translate }}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ 'assistants.phoneNumber' | translate }} <span class="text-gray-400 text-xs">{{ 'assistants.optional' | translate }}</span>
                  </label>
                  <input type="tel"
                         [(ngModel)]="editForm.phoneNumber"
                         placeholder="{{ 'assistants.enterPhone' | translate }}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
              </div>
            </div>

            <!-- Account Status -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ 'assistants.accountStatus' | translate }}
              </h3>
              
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" 
                         [(ngModel)]="editForm.isActive"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span class="text-sm font-medium text-gray-900">
                  {{ editForm.isActive ? ('assistants.active' | translate) : ('assistants.inactive' | translate) }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                {{ 'assistants.inactiveNote' | translate }}
              </p>
            </div>

            <!-- Permissions -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                {{ 'assistants.permissions' | translate }}
              </h3>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-700" [innerHTML]="'assistants.permissionsNote' | translate"></p>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div *ngFor="let permission of availablePermissions"
                     class="flex items-center gap-3 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <input type="checkbox"
                         [checked]="true"
                         disabled
                         class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 opacity-50 cursor-not-allowed">
                  <div>
                    <p class="font-medium text-gray-900">{{ permission.label | translate }}</p>
                    <p class="text-xs text-gray-500">{{ permission.description | translate }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Info Box -->
            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="flex-1">
                  <p class="font-semibold text-gray-900 mb-1">{{ 'assistants.importantNotes' | translate }}</p>
                  <ul class="text-sm text-gray-700 space-y-1">
                    <li>{{ 'assistants.note1' | translate }}</li>
                    <li>{{ 'assistants.note2' | translate }}</li>
                    <li>{{ 'assistants.note3' | translate }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Footer -->
          <div class="bg-gray-50 px-8 py-4 border-t flex items-center justify-between">
            <button [routerLink]="['/dashboard/my-assistants', assistantId]"
                    [disabled]="isSaving"
                    class="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ 'assistants.cancel' | translate }}
            </button>
            <button (click)="saveChanges()"
                    [disabled]="!isFormValid() || isSaving"
                    class="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              <svg *ngIf="isSaving" class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg *ngIf="!isSaving" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span *ngIf="!isSaving">{{ 'assistants.saveChanges' | translate }}</span>
              <span *ngIf="isSaving">{{ 'assistants.saving' | translate }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssistantEditComponent implements OnInit {
  private readonly API_URL = environment.apiBaseUrl;
  
  assistant: Assistant | null = null;
  isLoading = false;
  isSaving = false;
  assistantId: string = '';

  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: '',
    isActive: true,
    permissions: [] as string[]
  };

  availablePermissions = [
    {
      value: 'mark_attendance',
      label: 'assistants.markAttendancePerm',
      description: 'assistants.markAttendanceDesc'
    },
    {
      value: 'manage_assignments',
      label: 'assistants.manageAssignmentsPerm',
      description: 'assistants.manageAssignmentsDesc'
    },
    {
      value: 'manage_materials',
      label: 'assistants.manageMaterialsPerm',
      description: 'assistants.manageMaterialsDesc'
    },
    {
      value: 'view_students',
      label: 'assistants.viewStudentsPerm',
      description: 'assistants.viewStudentsDesc'
    },
    {
      value: 'manage_announcements',
      label: 'assistants.manageAnnouncementsPerm',
      description: 'assistants.manageAnnouncementsDesc'
    },
    {
      value: 'view_grades',
      label: 'assistants.viewGradesPerm',
      description: 'assistants.viewGradesDesc'
    }
  ];

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
          this.populateForm();
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

  populateForm() {
    if (!this.assistant) return;

    this.editForm = {
      firstName: this.assistant.firstName,
      lastName: this.assistant.lastName,
      email: this.assistant.email,
      phoneNumber: this.assistant.phoneNumber || '',
      avatar: this.assistant.avatar || '',
      isActive: this.assistant.isActive,
      permissions: [...this.assistant.assistantInfo.permissions]
    };
  }

  hasPermission(permission: string): boolean {
    return this.editForm.permissions.includes(permission);
  }

  togglePermission(permission: string) {
    const index = this.editForm.permissions.indexOf(permission);
    if (index > -1) {
      this.editForm.permissions.splice(index, 1);
    } else {
      this.editForm.permissions.push(permission);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.editForm.firstName.trim() &&
      this.editForm.lastName.trim() &&
      this.editForm.email.trim()
    );
  }

  saveChanges() {
    if (!this.isFormValid()) return;

    this.isSaving = true;
    const updateData = {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      email: this.editForm.email,
      phoneNumber: this.editForm.phoneNumber,
      avatar: this.editForm.avatar,
      isActive: this.editForm.isActive,
      permissions: this.editForm.permissions
    };

    this.http.put<ApiResponse>(`${this.API_URL}/assistants/${this.assistantId}`, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assistants.updatedSuccess'));
          this.router.navigate(['/dashboard/my-assistants', this.assistantId]);
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Update assistant error:', error);
        this.toastService.error(error.error?.message || this.translate.instant('assistants.failedToUpdate'));
        this.isSaving = false;
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.error(this.translate.instant('assistants.imageSizeError'));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error(this.translate.instant('assistants.imageTypeError'));
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.editForm.avatar = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }
}

