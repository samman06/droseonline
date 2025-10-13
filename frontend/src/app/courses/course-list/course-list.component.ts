import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService, Course } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Courses</h1>
          <p class="text-gray-600 mt-1">Manage course offerings and schedules</p>
        </div>
        <button 
          *ngIf="canCreateCourse"
          [routerLink]="['/dashboard/courses/new']"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Course
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select [(ngModel)]="filters.isActive" (change)="loadCourses()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" [(ngModel)]="filters.search" (input)="onSearchChange()" 
                   placeholder="Search courses..." 
                   class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div class="flex items-end">
            <button (click)="resetFilters()" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let course of courses" 
             class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border-l-4"
             [class.border-green-500]="course.isActive"
             [class.border-gray-300]="!course.isActive">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900">{{ course.name }}</h3>
              <p class="text-sm text-gray-600">{{ course.code }}</p>
            </div>
            <span [class]="getStatusClass(course.isActive)">
              {{ course.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <div class="space-y-2 text-sm text-gray-600 mb-4">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>{{ course.teacher?.firstName }} {{ course.teacher?.lastName }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span>{{ course.subject?.name || 'N/A' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span>{{ course.currentEnrollment || 0 }} students</span>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-gray-200">
            <button [routerLink]="['/dashboard/courses', course._id]"
                    class="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
              View Details
            </button>
            <button *ngIf="canEdit(course)" 
                    [routerLink]="['/dashboard/courses', course._id, 'edit']"
                    class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              Edit
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && courses.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
      </div>
    </div>
  `
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  loading = false;
  currentUser: any;
  searchTimeout: any;

  filters = {
    isActive: '',
    search: ''
  };

  pagination = {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  };

  constructor(
    private courseService: CourseService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.isActive) params.isActive = this.filters.isActive;
    if (this.filters.search) params.search = this.filters.search;

    this.courseService.getCourses(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.courses = response.data;
          if (response.pagination) {
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

  resetFilters(): void {
    this.filters = { isActive: '', search: '' };
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

  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
  }
}
