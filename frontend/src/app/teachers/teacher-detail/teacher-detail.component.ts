import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">Back to Teachers</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading teacher details...</p>
        </div>
      </div>

      <!-- Teacher Details -->
      <div *ngIf="teacher && !isLoading" class="space-y-6">
        <!-- Header Card -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-6">
                <div class="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30">
                  <span class="text-2xl font-bold text-purple-600">
                    {{ teacher.firstName.charAt(0) }}{{ teacher.lastName.charAt(0) }}
                  </span>
                </div>
                <div class="text-white">
                  <h1 class="text-3xl font-bold">{{ teacher.fullName }}</h1>
                  <p class="text-indigo-100 mt-1 font-mono text-sm">{{ teacher.academicInfo.employeeId }}</p>
                  <div class="flex items-center mt-2 space-x-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      {{ teacher.academicInfo.subjects?.length || 0 }} Subjects
                    </span>
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      {{ teacher.academicInfo.groups?.length || 0 }} Groups
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex space-x-3">
                <button [routerLink]="['/dashboard/teachers', teacher.id, 'edit']" class="btn-edit">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit
                </button>
                <button (click)="deleteTeacher()" class="btn-danger">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Personal Information -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <h2 class="text-lg font-bold text-gray-900">Personal Information</h2>
              </div>
            </div>
            <div class="p-6">
              <dl class="space-y-4">
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-24">Email</dt>
                  <dd class="text-sm text-gray-900 flex-1 flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    {{ teacher.email }}
                  </dd>
                </div>
                <div *ngIf="teacher.phoneNumber" class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-24">Phone</dt>
                  <dd class="text-sm text-gray-900 flex-1 flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    {{ teacher.phoneNumber }}
                  </dd>
                </div>
                <div *ngIf="teacher.address?.city" class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-24">City</dt>
                  <dd class="text-sm text-gray-900 flex-1 flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {{ teacher.address.city }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Academic Information -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h2 class="text-lg font-bold text-gray-900">Academic Information</h2>
              </div>
            </div>
            <div class="p-6">
              <dl class="space-y-4">
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-32">Employee ID</dt>
                  <dd class="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-md">{{ teacher.academicInfo.employeeId }}</dd>
                </div>
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-32">Subjects</dt>
                  <dd class="text-sm">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-medium">
                      {{ teacher.academicInfo.subjects?.length || 0 }} assigned
                    </span>
                  </dd>
                </div>
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-32">Groups</dt>
                  <dd class="text-sm">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg bg-purple-100 text-purple-800 font-medium">
                      {{ teacher.academicInfo.groups?.length || 0 }} assigned
                    </span>
                  </dd>
                </div>
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-32">Hire Date</dt>
                  <dd class="text-sm text-gray-900 flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {{ teacher.academicInfo.hireDate | date:'mediumDate' }}
                  </dd>
                </div>
                <div class="flex items-start">
                  <dt class="text-sm font-semibold text-gray-500 w-32">Status</dt>
                  <dd>
                    <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" 
                          [class]="teacher.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
                      <span class="w-2 h-2 rounded-full mr-2" 
                            [class]="teacher.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
                      {{ teacher.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-edit { 
      @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg 
      bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-white 
      shadow-md hover:shadow-lg transition-all duration-200;
    }
    .btn-danger { 
      @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg 
      bg-white text-red-600 hover:bg-red-50 border-2 border-white 
      shadow-md hover:shadow-lg transition-all duration-200;
    }
  `]
})
export class TeacherDetailComponent implements OnInit {
  teacher: any;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.teacherService.getTeacher(id).subscribe({
      next: (response) => {
        this.teacher = response.data.teacher || response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teachers']);
  }

  async deleteTeacher(): Promise<void> {
    if (!this.teacher) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Teacher',
      message: `Are you sure you want to delete ${this.teacher.fullName}? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.teacherService.deleteTeacher(this.teacher.id).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/teachers']);
        },
        error: (error) => {
          console.error('Error deleting teacher:', error);
        }
      });
    }
  }
}

