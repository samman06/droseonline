import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  academicInfo: {
    employeeId: string;
    hireDate: Date;
    subjects: any[];
    groups: any[];
  };
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 p-6">
      <!-- Header Section -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Teachers</h1>
          <p class="mt-2 text-gray-600">Manage teacher records, assignments, and professional information</p>
          <div class="mt-2 text-sm text-gray-500">
            Total: {{ pagination.total }} teachers
          </div>
        </div>
        <div class="mt-4 lg:mt-0 flex space-x-3">
          <button (click)="exportTeachers()" class="btn-outline inline-flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export
          </button>
          <button (click)="addNewTeacher()" class="btn-primary inline-flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add New Teacher
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ getActiveTeachersCount() }}</p>
                <p class="text-sm text-gray-500">Active Teachers</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
               <div class="ml-4">
                 <p class="text-2xl font-bold text-gray-900">{{ getDepartmentCount() }}</p>
                 <p class="text-sm text-gray-500">Subjects</p>
               </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ getNewTeachersThisMonth() }}</p>
                <p class="text-sm text-gray-500">New This Month</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
               <div class="ml-4">
                 <p class="text-2xl font-bold text-gray-900">{{ getCertifiedTeachersCount() }}</p>
                 <p class="text-sm text-gray-500">With Groups</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="card">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label class="form-label">Search</label>
              <input 
                type="text" 
                [(ngModel)]="filters.search" 
                (ngModelChange)="onFiltersChange()" 
                class="form-input" 
                placeholder="Search by name, email, or ID..."
              >
            </div>
            
             <div>
               <label class="form-label">Subject</label>
               <input 
                 type="text" 
                 [(ngModel)]="filters.subject" 
                 (ngModelChange)="onFiltersChange()" 
                 class="form-input" 
                 placeholder="Filter by subject..."
               >
             </div>
            
            <div>
              <label class="form-label">Status</label>
              <select [(ngModel)]="filters.isActive" (ngModelChange)="onFiltersChange()" class="form-select">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button (click)="clearFilters()" class="btn-outline w-full">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div *ngIf="selectedTeachers.length > 0" class="card border-orange-200 bg-orange-50">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm font-medium text-orange-800">
                {{ selectedTeachers.length }} teacher(s) selected
              </span>
            </div>
            <div class="flex space-x-2">
              <button (click)="bulkActivate()" class="btn-outline text-green-600 border-green-300 hover:bg-green-50">
                Activate Selected
              </button>
              <button (click)="bulkDeactivate()" class="btn-outline text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                Deactivate Selected
              </button>
              <button (click)="bulkDelete()" class="btn-outline text-red-600 border-red-300 hover:bg-red-50">
                Delete Selected
              </button>
              <button (click)="clearSelection()" class="btn-outline">
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-500">Loading teachers...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && teachers.length === 0" class="text-center py-12 card">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by adding a new teacher to the system.</p>
        <div class="mt-6">
          <button (click)="addNewTeacher()" class="btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Teacher
          </button>
        </div>
      </div>

      <!-- Teachers Table -->
      <div *ngIf="!isLoading && teachers.length > 0" class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    [checked]="allSelected" 
                    [indeterminate]="someSelected"
                    (change)="toggleAllSelection()"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher Information
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Details
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let teacher of teachers; trackBy: trackByTeacherId" class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    [checked]="isSelected(teacher.id)"
                    (change)="toggleSelection(teacher.id)"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {{ teacher.firstName.charAt(0) + teacher.lastName.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ teacher.fullName }}</div>
                      <div class="text-sm text-gray-500">{{ teacher.email }}</div>
                      <div class="text-xs text-gray-400">ID: {{ teacher.academicInfo.employeeId }}</div>
                    </div>
                  </div>
                </td>
                 <td class="px-6 py-4 whitespace-nowrap">
                   <div class="text-sm font-medium text-gray-900">
                     {{ teacher.academicInfo.subjects?.length || 0 }} Subject(s)
                   </div>
                   <div class="text-sm text-gray-500">
                     {{ teacher.academicInfo.groups?.length || 0 }} Group(s)
                   </div>
                 </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" 
                        [class]="teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ teacher.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ teacher.academicInfo.hireDate | date:'MMM d, y' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button 
                      (click)="viewTeacher(teacher)"
                      class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      title="View Details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editTeacher(teacher)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                      title="Edit Teacher"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deleteTeacher(teacher)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200"
                      title="Delete Teacher"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination.pages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button 
              (click)="changePage(pagination.page - 1)"
              [disabled]="pagination.page === 1"
              [class.opacity-50]="pagination.page === 1"
              [class.cursor-not-allowed]="pagination.page === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              (click)="changePage(pagination.page + 1)"
              [disabled]="pagination.page === pagination.pages"
              [class.opacity-50]="pagination.page === pagination.pages"
              [class.cursor-not-allowed]="pagination.page === pagination.pages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  (click)="changePage(pagination.page - 1)"
                  [disabled]="pagination.page === 1"
                  [class.opacity-50]="pagination.page === 1"
                  [class.cursor-not-allowed]="pagination.page === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <button 
                  *ngFor="let page of getVisiblePages()"
                  (click)="changePage(page)"
                  [class.bg-blue-50]="page === pagination.page"
                  [class.border-blue-500]="page === pagination.page"
                  [class.text-blue-600]="page === pagination.page"
                  [class.bg-white]="page !== pagination.page"
                  [class.border-gray-300]="page !== pagination.page"
                  [class.text-gray-500]="page !== pagination.page"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-50"
                >
                  {{ page }}
                </button>
                
                <button 
                  (click)="changePage(pagination.page + 1)"
                  [disabled]="pagination.page === pagination.pages"
                  [class.opacity-50]="pagination.page === pagination.pages"
                  [class.cursor-not-allowed]="pagination.page === pagination.pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary { @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200; }
    .btn-outline { @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200; }
    .card { @apply bg-white shadow-sm rounded-lg border border-gray-200; }
    .card-body { @apply px-6 py-4; }
    .form-input { @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200; }
    .form-select { @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200; }
    .form-label { @apply block text-sm font-medium text-gray-700 mb-1; }
  `]
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  selectedTeachers: string[] = [];
  isLoading = false;
  
  filters = {
    search: '',
    subject: '',
    group: '',
    isActive: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  Math = Math;

  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.subject) params.subject = this.filters.subject;
    if (this.filters.group) params.group = this.filters.group;
    if (this.filters.isActive) params.isActive = this.filters.isActive;

    this.teacherService.getTeachers(params).subscribe({
      next: (response) => {
        console.log('Teachers response:', response);
        if (response.success && response.data) {
          this.teachers = response.data.teachers || [];
          if (response.data.pagination) {
            this.pagination = {
              ...this.pagination,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            };
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.teachers = [];
        this.isLoading = false;
      }
    });
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadTeachers();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      subject: '',
      group: '',
      isActive: ''
    };
    this.pagination.page = 1;
    this.loadTeachers();
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadTeachers();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  isSelected(teacherId: string): boolean {
    return this.selectedTeachers.includes(teacherId);
  }

  toggleSelection(teacherId: string): void {
    const index = this.selectedTeachers.indexOf(teacherId);
    if (index > -1) {
      this.selectedTeachers.splice(index, 1);
    } else {
      this.selectedTeachers.push(teacherId);
    }
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedTeachers = [];
    } else {
      this.selectedTeachers = this.teachers.map(t => t.id);
    }
  }

  get allSelected(): boolean {
    return this.teachers.length > 0 && this.selectedTeachers.length === this.teachers.length;
  }

  get someSelected(): boolean {
    return this.selectedTeachers.length > 0 && this.selectedTeachers.length < this.teachers.length;
  }

  clearSelection(): void {
    this.selectedTeachers = [];
  }

  bulkActivate(): void {
    if (confirm(`Activate ${this.selectedTeachers.length} teacher(s)?`)) {
      this.teacherService.bulkAction('activate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`${this.selectedTeachers.length} teacher(s) activated successfully`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk activate error:', error);
          alert('Failed to activate teachers');
        }
      });
    }
  }

  bulkDeactivate(): void {
    if (confirm(`Deactivate ${this.selectedTeachers.length} teacher(s)?`)) {
      this.teacherService.bulkAction('deactivate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`${this.selectedTeachers.length} teacher(s) deactivated successfully`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk deactivate error:', error);
          alert('Failed to deactivate teachers');
        }
      });
    }
  }

  bulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedTeachers.length} teacher(s)? This action cannot be undone.`)) {
      this.teacherService.bulkAction('delete', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.message || `${this.selectedTeachers.length} teacher(s) deleted successfully`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk delete error:', error);
          let errorMessage = 'Failed to delete teachers';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          alert(errorMessage);
        }
      });
    }
  }

  deleteTeacher(teacher: Teacher): void {
    if (confirm(`Are you sure you want to delete ${teacher.fullName}? This action cannot be undone.`)) {
      this.teacherService.deleteTeacher(teacher.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`${teacher.fullName} has been deleted successfully.`);
            this.loadTeachers();
          } else {
            alert('Failed to delete teacher: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting teacher:', error);
          let errorMessage = 'Failed to delete teacher';
          if (error.status === 403) {
            errorMessage = 'You do not have permission to delete teachers. Admin access required.';
          } else if (error.status === 404) {
            errorMessage = 'Teacher not found.';
          } else if (error.status === 400 && error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        }
      });
    }
  }

  exportTeachers(): void {
    if (this.teachers.length === 0) return;
    
    const headers = ['Employee ID', 'Name', 'Email', 'Subjects', 'Groups', 'Status', 'Hire Date'];
    const csvContent = [
      headers.join(','),
      ...this.teachers.map(teacher => [
        teacher.academicInfo.employeeId,
        `"${teacher.fullName}"`,
        teacher.email,
        teacher.academicInfo.subjects?.length || 0,
        teacher.academicInfo.groups?.length || 0,
        teacher.isActive ? 'Active' : 'Inactive',
        new Date(teacher.academicInfo.hireDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByTeacherId(index: number, teacher: Teacher): string {
    return teacher.id;
  }

  // Navigation methods
  addNewTeacher(): void {
    this.router.navigate(['/dashboard/teachers/new']);
  }

  viewTeacher(teacher: Teacher): void {
    this.router.navigate(['/dashboard/teachers', teacher.id]);
  }

  editTeacher(teacher: Teacher): void {
    this.router.navigate(['/dashboard/teachers', teacher.id, 'edit']);
  }

  // Statistics methods
  getActiveTeachersCount(): number {
    return this.teachers.filter(teacher => teacher.isActive).length;
  }

  getDepartmentCount(): number {
    // Total number of unique subjects taught
    const allSubjects = this.teachers.flatMap(t => t.academicInfo.subjects || []);
    return new Set(allSubjects.map(s => s._id || s)).size;
  }

  getNewTeachersThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.teachers.filter(teacher => {
      const hireDate = new Date(teacher.academicInfo.hireDate);
      return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
    }).length;
  }

  getCertifiedTeachersCount(): number {
    // Teachers assigned to groups
    return this.teachers.filter(teacher => 
      teacher.academicInfo.groups && teacher.academicInfo.groups.length > 0
    ).length;
  }
}
