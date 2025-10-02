import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    year: string;
    major: string;
    gpa?: number;
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
        <div class="flex space-x-3">
          <button 
            (click)="exportStudents()"
            class="btn-outline"
            [disabled]="students.length === 0"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export
          </button>
          <button 
            (click)="importStudents()"
            class="btn-outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
            </svg>
            Import
          </button>
          <button 
            routerLink="/dashboard/students/new"
            class="btn-primary"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Student
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label class="form-label">Academic Year</label>
              <select 
                [(ngModel)]="filters.year"
                (ngModelChange)="onFiltersChange()"
                class="form-select"
              >
                <option value="">All Years</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            
            <div>
              <label class="form-label">Major</label>
              <select 
                [(ngModel)]="filters.major"
                (ngModelChange)="onFiltersChange()"
                class="form-select"
              >
                <option value="">All Majors</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Psychology">Psychology</option>
                <option value="Business">Business</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Economics">Economics</option>
              </select>
            </div>
            
            <div>
              <label class="form-label">Status</label>
              <select 
                [(ngModel)]="filters.isActive"
                (ngModelChange)="onFiltersChange()"
                class="form-select"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button 
                (click)="clearFilters()"
                class="btn-outline w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div *ngIf="selectedStudents.length > 0" class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm font-medium text-blue-900">
              {{ selectedStudents.length }} student{{ selectedStudents.length === 1 ? '' : 's' }} selected
            </span>
          </div>
          <div class="flex space-x-2">
            <button 
              (click)="bulkActivate()"
              class="btn-sm btn-outline"
            >
              Activate
            </button>
            <button 
              (click)="bulkDeactivate()"
              class="btn-sm btn-outline"
            >
              Deactivate
            </button>
            <button 
              (click)="bulkDelete()"
              class="btn-sm btn-danger"
            >
              Delete
            </button>
            <button 
              (click)="clearSelection()"
              class="btn-sm btn-outline"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        <div class="card-body p-0">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && students.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding a new student.</p>
            <div class="mt-6">
              <button 
                routerLink="/dashboard/students/new"
                class="btn-primary"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Student
              </button>
            </div>
          </div>

          <!-- Students Table -->
          <div *ngIf="!isLoading && students.length > 0" class="overflow-x-auto">
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
                    Student
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Info
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let student of students; trackBy: trackByStudentId" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      [checked]="isSelected(student.id)"
                      (change)="toggleSelection(student.id)"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-sm font-medium text-blue-600">
                            {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          <a 
                            [routerLink]="['/dashboard/students', student.id]"
                            class="hover:text-blue-600"
                          >
                            {{ student.fullName }}
                          </a>
                        </div>
                        <div class="text-sm text-gray-500">{{ student.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ student.academicInfo.studentId }}</div>
                    <div class="text-sm text-gray-500">{{ student.academicInfo.year }} • {{ student.academicInfo.major }}</div>
                    <div *ngIf="student.academicInfo.gpa" class="text-sm" [class]="getGpaColor(student.academicInfo.gpa)">
                      GPA: {{ student.academicInfo.gpa | number:'1.2-2' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ student.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ student.academicInfo.enrollmentDate | date:'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button 
                        [routerLink]="['/dashboard/students', student.id]"
                        class="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      <button 
                        [routerLink]="['/dashboard/students', student.id, 'edit']"
                        class="text-indigo-600 hover:text-indigo-900"
                        title="Edit Student"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button 
                        (click)="deleteStudent(student)"
                        class="text-red-600 hover:text-red-900"
                        title="Delete Student"
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
          <div *ngIf="!isLoading && students.length > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 flex justify-between sm:hidden">
                <button 
                  (click)="changePage(pagination.page - 1)"
                  [disabled]="pagination.page <= 1"
                  class="btn-outline"
                >
                  Previous
                </button>
                <button 
                  (click)="changePage(pagination.page + 1)"
                  [disabled]="pagination.page >= pagination.pages"
                  class="btn-outline"
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
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button 
                      (click)="changePage(pagination.page - 1)"
                      [disabled]="pagination.page <= 1"
                      class="pagination-btn rounded-l-md"
                    >
                      Previous
                    </button>
                    
                    <button 
                      *ngFor="let page of getVisiblePages()"
                      (click)="changePage(page)"
                      [class]="page === pagination.page ? 'pagination-btn-active' : 'pagination-btn'"
                    >
                      {{ page }}
                    </button>
                    
                    <button 
                      (click)="changePage(pagination.page + 1)"
                      [disabled]="pagination.page >= pagination.pages"
                      class="pagination-btn rounded-r-md"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-label {
      @apply block text-sm font-medium text-gray-700 mb-1;
    }
    
    .form-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .form-select {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .btn-primary {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .btn-outline {
      @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .btn-danger {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
    }
    
    .btn-sm {
      @apply px-3 py-1 text-xs;
    }
    
    .card {
      @apply bg-white shadow-sm rounded-lg border border-gray-200;
    }
    
    .card-body {
      @apply px-6 py-4;
    }
    
    .pagination-btn {
      @apply relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50;
    }
    
    .pagination-btn-active {
      @apply relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600;
    }
  `]
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  selectedStudents: string[] = [];
  isLoading = false;
  
  filters = {
    search: '',
    year: '',
    major: '',
    isActive: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  Math = Math; // Make Math available in template

  constructor(
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  // Navigation methods
  addNewStudent(): void {
    this.router.navigate(['/dashboard/students/new']);
  }

  viewStudent(student: Student): void {
    this.router.navigate(['/dashboard/students', student.id]);
  }

  editStudent(student: Student): void {
    this.router.navigate(['/dashboard/students', student.id, 'edit']);
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
      year: '',
      major: '',
      isActive: ''
    };
    this.pagination.page = 1;
    this.loadStudents();
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadStudents();
  }

  getVisiblePages(): number[] {
    const currentPage = this.pagination.page;
    const totalPages = this.pagination.pages;
    const visiblePages: number[] = [];
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    
    return visiblePages;
  }

  // Selection methods
  get allSelected(): boolean {
    return this.students.length > 0 && this.selectedStudents.length === this.students.length;
  }

  get someSelected(): boolean {
    return this.selectedStudents.length > 0 && this.selectedStudents.length < this.students.length;
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedStudents = [];
    } else {
      this.selectedStudents = this.students.map(s => s.id);
    }
  }

  toggleSelection(studentId: string): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  isSelected(studentId: string): boolean {
    return this.selectedStudents.includes(studentId);
  }

  clearSelection(): void {
    this.selectedStudents = [];
  }

  // Bulk operations
  bulkActivate(): void {
    if (this.selectedStudents.length === 0) return;
    
    if (confirm(`Are you sure you want to activate ${this.selectedStudents.length} student(s)?`)) {
      this.studentService.bulkAction('activate', this.selectedStudents).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStudents(); // Reload the list
            this.clearSelection();
            // TODO: Show success toast
            console.log(response.message);
          } else {
            alert('Failed to activate students');
          }
        },
        error: (error) => {
          console.error('Error activating students:', error);
          alert('Failed to activate students');
        }
      });
    }
  }

  bulkDeactivate(): void {
    if (this.selectedStudents.length === 0) return;
    
    if (confirm(`Are you sure you want to deactivate ${this.selectedStudents.length} student(s)?`)) {
      this.studentService.bulkAction('deactivate', this.selectedStudents).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStudents(); // Reload the list
            this.clearSelection();
            // TODO: Show success toast
            console.log(response.message);
          } else {
            alert('Failed to deactivate students');
          }
        },
        error: (error) => {
          console.error('Error deactivating students:', error);
          alert('Failed to deactivate students');
        }
      });
    }
  }

  bulkDelete(): void {
    if (this.selectedStudents.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${this.selectedStudents.length} student(s)? This action cannot be undone.`)) {
      this.studentService.bulkAction('delete', this.selectedStudents).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStudents(); // Reload the list
            this.clearSelection();
            // TODO: Show success toast
            console.log(response.message);
          } else {
            alert('Failed to delete students');
          }
        },
        error: (error) => {
          console.error('Error deleting students:', error);
          alert('Failed to delete students');
        }
      });
    }
  }

  // Individual operations
  deleteStudent(student: Student): void {
    if (confirm(`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`)) {
      console.log('Attempting to delete student:', student.id);
      
      this.studentService.deleteStudent(student.id).subscribe({
        next: (response) => {
          console.log('Delete student response:', response);
          if (response.success) {
            console.log('Student deleted successfully');
            this.loadStudents(); // Reload the list
            // TODO: Show success toast
            alert(`${student.fullName} has been deleted successfully.`);
          } else {
            console.error('Delete failed with message:', response.message);
            alert('Failed to delete student: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting student:', error);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to delete student';
          if (error.status === 403) {
            errorMessage = 'You do not have permission to delete students. Admin access required.';
          } else if (error.status === 404) {
            errorMessage = 'Student not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred while deleting student.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  // Utility methods
  trackByStudentId(index: number, student: Student): string {
    return student.id;
  }

  getGpaColor(gpa: number): string {
    if (gpa >= 3.5) return 'text-green-600 font-semibold';
    if (gpa >= 3.0) return 'text-blue-600 font-semibold';
    if (gpa >= 2.5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  // Export/Import methods
  exportStudents(): void {
    if (this.students.length === 0) return;
    
    // Create CSV content
    const headers = ['Student ID', 'Name', 'Email', 'Year', 'Major', 'GPA', 'Status', 'Enrollment Date'];
    const csvContent = [
      headers.join(','),
      ...this.students.map(student => [
        student.academicInfo.studentId,
        `"${student.fullName}"`,
        student.email,
        student.academicInfo.year,
        `"${student.academicInfo.major}"`,
        student.academicInfo.gpa || '',
        student.isActive ? 'Active' : 'Inactive',
        new Date(student.academicInfo.enrollmentDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importStudents(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const csv = e.target.result;
          this.processCsvImport(csv);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private processCsvImport(csv: string): void {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    // TODO: Implement CSV parsing and validation
    console.log('CSV Import - Headers:', headers);
    console.log('CSV Import - Lines:', lines.length - 1);
    
    alert(`CSV import functionality will be implemented. Found ${lines.length - 1} rows to process.`);
  }
}