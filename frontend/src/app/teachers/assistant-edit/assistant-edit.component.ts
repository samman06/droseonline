import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, FormsModule, RouterModule],
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
          <h3 class="text-xl font-bold text-gray-900 mb-2">Assistant Not Found</h3>
          <p class="text-gray-600 mb-6">The assistant you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <button routerLink="/dashboard/my-assistants"
                  class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Assistants
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
            Back to Details
          </button>
          <h1 class="text-3xl font-bold text-gray-900">Edit Assistant</h1>
          <p class="text-gray-600 mt-2">Update assistant information and permissions</p>
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
                Basic Information
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span class="text-red-500">*</span>
                  </label>
                  <input type="text" 
                         [(ngModel)]="editForm.firstName"
                         placeholder="Enter first name"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name <span class="text-red-500">*</span>
                  </label>
                  <input type="text"
                         [(ngModel)]="editForm.lastName"
                         placeholder="Enter last name"
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
                Contact Information
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span class="text-red-500">*</span>
                  </label>
                  <input type="email"
                         [(ngModel)]="editForm.email"
                         placeholder="assistant@example.com"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span class="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input type="tel"
                         [(ngModel)]="editForm.phoneNumber"
                         placeholder="+201234567890"
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
                Account Status
              </h3>
              
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" 
                         [(ngModel)]="editForm.isActive"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span class="text-sm font-medium text-gray-900">
                  {{ editForm.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Inactive assistants cannot log in or access the system
              </p>
            </div>

            <!-- Permissions -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Permissions
              </h3>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-700">
                  <strong>Note:</strong> All assistants have full teaching access by default. These permissions cannot be modified.
                </p>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div *ngFor="let permission of availablePermissions"
                     class="flex items-center gap-3 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <input type="checkbox"
                         [checked]="true"
                         disabled
                         class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 opacity-50 cursor-not-allowed">
                  <div>
                    <p class="font-medium text-gray-900">{{ permission.label }}</p>
                    <p class="text-xs text-gray-500">{{ permission.description }}</p>
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
                  <p class="font-semibold text-gray-900 mb-1">Important Notes</p>
                  <ul class="text-sm text-gray-700 space-y-1">
                    <li>• Assistants have full access to all teaching features</li>
                    <li>• Assistants cannot access accounting or financial data</li>
                    <li>• You can only change basic information (name, email, status)</li>
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
              Cancel
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
              <span *ngIf="!isSaving">Save Changes</span>
              <span *ngIf="isSaving">Saving...</span>
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
      label: 'Mark Attendance',
      description: 'Can mark student attendance'
    },
    {
      value: 'manage_assignments',
      label: 'Manage Assignments',
      description: 'Can create and grade assignments'
    },
    {
      value: 'manage_materials',
      label: 'Manage Materials',
      description: 'Can upload and manage course materials'
    },
    {
      value: 'view_students',
      label: 'View Students',
      description: 'Can view student information'
    },
    {
      value: 'manage_announcements',
      label: 'Manage Announcements',
      description: 'Can create and edit announcements'
    },
    {
      value: 'view_grades',
      label: 'View Grades',
      description: 'Can view student grades'
    }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
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
        this.toastService.error('Failed to load assistant details');
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
          this.toastService.success('Assistant updated successfully');
          this.router.navigate(['/dashboard/my-assistants', this.assistantId]);
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Update assistant error:', error);
        this.toastService.error(error.error?.message || 'Failed to update assistant');
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
        this.toastService.error('Image size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Please select an image file');
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

