import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  academicInfo: {
    studentId: string;
    currentYear: number;
    enrollmentDate: Date;
    groups: any[];
  };
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Students</h1>
          <p class="text-gray-600">Manage student records and enrollments</p>
        </div>
        <button class="btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Student
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="form-label">Search</label>
              <input 
                type="text" 
                [(ngModel)]="filters.search"
                (input)="onFiltersChange()"
                class="form-input" 
                placeholder="Search students..."
              >
            </div>
            <div>
              <label class="form-label">Year</label>
              <select 
                [(ngModel)]="filters.currentYear"
                (change)="onFiltersChange()"
                class="form-input"
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
            <div>
              <label class="form-label">Status</label>
              <select 
                [(ngModel)]="filters.isActive"
                (change)="onFiltersChange()"
                class="form-input"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div class="flex items-end">
              <button 
                (click)="clearFilters()"
                class="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groups
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let student of students" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                          <span class="text-sm font-medium text-white">
                            {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ student.fullName }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ student.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ student.academicInfo.studentId || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Year {{ student.academicInfo.currentYear || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="flex flex-wrap gap-1">
                      <span 
                        *ngFor="let group of student.academicInfo?.groups?.slice(0, 2)" 
                        class="badge-secondary"
                      >
                        {{ group.name || group.code || 'Group' }}
                      </span>
                      <span 
                        *ngIf="(student.academicInfo.groups.length || 0) > 2" 
                        class="badge-secondary"
                      >
                        +{{ (student.academicInfo.groups.length || 0) - 2 }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      [ngClass]="{
                        'badge-success': student.isActive,
                        'badge-danger': !student.isActive
                      }"
                    >
                      {{ student.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ student.academicInfo.enrollmentDate | date:'shortDate' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button class="text-primary-600 hover:text-primary-900">
                        View
                      </button>
                      <button class="text-gray-600 hover:text-gray-900">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Loading State -->
            <div *ngIf="isLoading" class="text-center py-12">
              <div class="spinner h-8 w-8 mx-auto"></div>
              <p class="mt-2 text-sm text-gray-500">Loading students...</p>
            </div>
            
            <!-- Empty State -->
            <div *ngIf="!isLoading && students.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by adding a new student.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="pagination.total > 0" class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
            {{ pagination.total }} results
          </p>
        </div>
        <div class="flex space-x-2">
          <button 
            [disabled]="pagination.page <= 1"
            (click)="changePage(pagination.page - 1)"
            class="btn-secondary"
            [class.opacity-50]="pagination.page <= 1"
          >
            Previous
          </button>
          <button 
            [disabled]="pagination.page >= pagination.pages"
            (click)="changePage(pagination.page + 1)"
            class="btn-secondary"
            [class.opacity-50]="pagination.page >= pagination.pages"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  isLoading = true;
  
  // Make Math available in template
  Math = Math;
  
  filters = {
    search: '',
    currentYear: '',
    isActive: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    
    const params = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filters
    };

    console.log('Loading students with params:', params);

    this.studentService.getStudents(params).subscribe({
      next: (response) => {
        console.log('Students API response:', response);
        if (response.success) {
          // Handle the response structure from our backend
          if (response.data && response.data.students) {
            this.students = response.data.students;
            this.pagination = response.data.pagination || this.pagination;
          } else if (Array.isArray(response.data)) {
            // Fallback if data is directly an array
            this.students = response.data;
          } else {
            console.warn('Unexpected response structure:', response);
            this.students = [];
          }
        } else {
          console.error('API returned success: false', response);
          this.students = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.isLoading = false;
        // You might want to show a toast notification here
      }
    });
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadStudents();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      currentYear: '',
      isActive: ''
    };
    this.pagination.page = 1;
    this.loadStudents();
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadStudents();
  }
}
