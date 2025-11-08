import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseService, Course } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Enhanced Header with Gradient -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <h1 class="text-4xl font-bold mb-2">{{ 'courses.courseCatalog' | translate }}</h1>
              <p class="text-blue-100">{{ 'courses.exploreManageCourses' | translate }}</p>
              <div class="mt-3 flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm text-sm font-semibold">
                  <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
                  </svg>
                  {{ pagination.total }} {{ 'courses.courses' | translate }}
                </span>
              </div>
            </div>
          </div>
          <button 
            *ngIf="canCreateCourse"
            [routerLink]="['/dashboard/courses/new']"
            class="btn-create-course">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ 'courses.createNewCourse' | translate }}
          </button>
        </div>
      </div>

      <!-- Enhanced Search and Filters Bar -->
      <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <!-- Teacher View: Search Only -->
        <div *ngIf="currentUser?.role === 'teacher'" class="space-y-4">
          <div class="relative">
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'courses.searchYourCourses' | translate }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input 
                type="text" 
                [(ngModel)]="filters.search" 
                (input)="onSearchChange()" 
                [placeholder]="'courses.searchPlaceholder' | translate" 
                class="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all">
            </div>
          </div>
        </div>

        <!-- Admin View: Search + All Filters -->
        <div *ngIf="currentUser?.role === 'admin'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="md:col-span-2 relative">
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'common.search' | translate }}</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="filters.search" 
                  (input)="onSearchChange()" 
                  [placeholder]="'courses.searchPlaceholder' | translate" 
                  class="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all">
              </div>
            </div>

            <!-- Teacher Filter -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'courses.teacher' | translate }}</label>
              <select 
                [(ngModel)]="filters.teacherId" 
                (change)="onFilterChange()"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all">
                <option value="">{{ 'courses.allTeachers' | translate }}</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{ teacher.fullName || teacher.firstName + ' ' + teacher.lastName }}
                </option>
              </select>
            </div>

            <!-- Subject Filter -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'courses.subject' | translate }}</label>
              <select 
                [(ngModel)]="filters.subjectId" 
                (change)="onFilterChange()"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all">
                <option value="">{{ 'courses.allSubjects' | translate }}</option>
                <option *ngFor="let subject of subjects" [value]="subject._id">
                  {{ subject.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Reset Button for Admin -->
          <div class="flex justify-end">
            <button 
              (click)="resetFilters()" 
              class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ 'courses.resetFilters' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let course of courses" 
             class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-indigo-300 transform hover:-translate-y-1">
          
          <!-- Gradient Header -->
          <div class="h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div class="p-6">
            <!-- Course Title and Code -->
            <div class="mb-4">
              <h3 class="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {{ course.name }}
              </h3>
              <span class="inline-block px-3 py-1 text-xs font-mono font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full">
                {{ course.code }}
              </span>
            </div>

            <!-- Subject Badge -->
            <div class="mb-4">
              <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                {{ course.subject?.name || ('courses.noSubject' | translate) }}
              </span>
            </div>
            
            <!-- Course Info -->
            <div class="space-y-3 mb-5">
              <!-- Teacher -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-500 font-medium">{{ 'courses.teacher' | translate }}</p>
                  <p class="text-sm font-semibold text-gray-900">{{ course.teacher?.fullName || course.teacher?.firstName + ' ' + course.teacher?.lastName }}</p>
                </div>
              </div>

              <!-- Students Count -->
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-50 rounded-lg">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-500 font-medium">{{ 'courses.enrolled' | translate }}</p>
                  <p class="text-sm font-semibold text-gray-900">{{ course.studentCount || 0 }} {{ 'courses.students' | translate }}</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-4 border-t border-gray-200">
              <button 
                [routerLink]="['/dashboard/courses', course._id]"
                class="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                {{ 'common.view' | translate }}
              </button>
              <button 
                *ngIf="canEdit(course)" 
                [routerLink]="['/dashboard/courses', course._id, 'edit']"
                class="px-4 py-2.5 text-sm font-semibold bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                {{ 'common.edit' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Empty State -->
      <div *ngIf="!loading && courses.length === 0" class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-300 p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="p-4 bg-white rounded-full inline-flex items-center justify-center mb-4 shadow-lg">
            <svg class="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ 'courses.noCoursesFound' | translate }}</h3>
          <p class="text-gray-600 mb-6">{{ 'courses.startBuildingCatalog' | translate }}</p>
          <button 
            *ngIf="canCreateCourse"
            [routerLink]="['/dashboard/courses/new']"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ 'courses.createFirstCourse' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-create-course {
      @apply inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white font-semibold rounded-xl backdrop-blur-sm border-2 border-white border-opacity-30 shadow-lg hover:bg-opacity-30 hover:shadow-xl transition-all duration-200;
    }

    /* Custom scrollbar for the page */
    ::-webkit-scrollbar {
      width: 10px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #4F46E5, #7C3AED);
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #4338CA, #6D28D9);
    }

    /* Smooth animations */
    .group:hover {
      transform: translateY(-4px);
    }

    /* Loading animation */
    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }
  `]
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  teachers: any[] = [];
  subjects: any[] = [];
  loading = false;
  currentUser: any;
  searchTimeout: any;

  filters = {
    search: '',
    teacherId: '',
    subjectId: ''
  };

  pagination = {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  };

  constructor(
    private courseService: CourseService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private toastService: ToastService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    
    // Only load teachers and subjects for admins (they have filters)
    if (this.currentUser?.role === 'admin') {
      this.loadTeachers();
      this.loadSubjects();
    }
    
    this.loadCourses();
  }

  loadTeachers(): void {
    this.teacherService.getTeachers({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = Array.isArray(response.data) 
            ? response.data 
            : (response.data.teachers || []);
        }
      },
      error: (error) => {
        console.error('Failed to load teachers', error);
      }
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjects = Array.isArray(response.data) 
            ? response.data 
            : (response.data.subjects || []);
        }
      },
      error: (error) => {
        console.error('Failed to load subjects', error);
      }
    });
  }

  loadCourses(): void {
    this.loading = true;
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.teacherId) params.teacherId = this.filters.teacherId;
    if (this.filters.subjectId) params.subjectId = this.filters.subjectId;

    this.courseService.getCourses(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested data structure
          const responseData = response.data as any;
          this.courses = responseData.courses || response.data;
          if (responseData.pagination) {
            this.pagination = responseData.pagination;
          } else if (response.pagination) {
            this.pagination = response.pagination;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.page = 1;
      this.loadCourses();
    }, 500);
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadCourses();
  }

  resetFilters(): void {
    this.filters = { 
      search: '',
      teacherId: '',
      subjectId: ''
    };
    this.pagination.page = 1;
    this.loadCourses();
  }

  get canCreateCourse(): boolean {
    return this.currentUser?.role === 'admin';
  }

  canEdit(course: Course): boolean {
    if (this.currentUser?.role === 'admin') return true;
    return course.teacher === this.currentUser?._id;
  }

}
