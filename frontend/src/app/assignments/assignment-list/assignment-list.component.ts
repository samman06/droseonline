import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AssignmentService, Assignment } from '../../services/assignment.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Assignments</h1>
          <p class="text-gray-600 mt-1">Manage assignments and submissions</p>
        </div>
        <button 
          *ngIf="canCreateAssignment"
          [routerLink]="['/dashboard/assignments/new']"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Assignment
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select [(ngModel)]="filters.type" (change)="loadAssignments()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="homework">Homework</option>
              <option value="quiz">Quiz</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="project">Project</option>
              <option value="presentation">Presentation</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select [(ngModel)]="filters.status" (change)="loadAssignments()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="graded">Graded</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" [(ngModel)]="filters.search" (input)="onSearchChange()" 
                   placeholder="Search assignments..." 
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

      <div *ngIf="!loading && assignments.length > 0" class="space-y-4">
        <div *ngFor="let assignment of assignments" 
             class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span [class]="getTypeClass(assignment.type)">{{ assignment.type }}</span>
                <span [class]="getStatusClass(assignment.status)">{{ assignment.status }}</span>
                <span *ngIf="isOverdue(assignment)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ assignment.title }}</h3>
              <p class="text-gray-600 mb-3 line-clamp-2">{{ assignment.description }}</p>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Due Date:</span>
                  <p class="font-medium">{{ formatDate(assignment.dueDate) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Max Points:</span>
                  <p class="font-medium">{{ assignment.maxPoints }}</p>
                </div>
                <div *ngIf="assignment.stats">
                  <span class="text-gray-500">Submissions:</span>
                  <p class="font-medium">{{ assignment.stats?.totalSubmissions || 0 }}</p>
                </div>
                <div *ngIf="assignment.stats">
                  <span class="text-gray-500">Avg Grade:</span>
                  <p class="font-medium">{{ assignment.stats?.averageGrade || 0 }}%</p>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col gap-2 ml-4">
              <button [routerLink]="['/dashboard/assignments', assignment._id]"
                      class="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                View
              </button>
              <button *ngIf="canEdit(assignment)" 
                      [routerLink]="['/dashboard/assignments', assignment._id, 'edit']"
                      class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                Edit
              </button>
              <button *ngIf="isStudent && canSubmit(assignment)"
                      [routerLink]="['/dashboard/assignments', assignment._id, 'submit']"
                      class="px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && assignments.length === 0" class="text-center py-12 bg-white rounded-lg">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
      </div>
    </div>
  `
})
export class AssignmentListComponent implements OnInit {
  assignments: Assignment[] = [];
  loading = false;
  currentUser: any;
  searchTimeout: any;

  filters = {
    type: '',
    status: '',
    search: ''
  };

  constructor(
    private assignmentService: AssignmentService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    const params: any = { page: 1, limit: 50 };
    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.search) params.search = this.filters.search;

    this.assignmentService.getAssignments(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested data structure
          const responseData = response.data as any;
          this.assignments = responseData.assignments || response.data;
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
    this.searchTimeout = setTimeout(() => this.loadAssignments(), 500);
  }

  resetFilters(): void {
    this.filters = { type: '', status: '', search: '' };
    this.loadAssignments();
  }

  get canCreateAssignment(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'teacher';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  canEdit(assignment: Assignment): boolean {
    if (this.currentUser?.role === 'admin') return true;
    return assignment.teacher === this.currentUser?._id;
  }

  canSubmit(assignment: Assignment): boolean {
    return assignment.status === 'published' && !this.isOverdue(assignment);
  }

  isOverdue(assignment: Assignment): boolean {
    return new Date(assignment.dueDate) < new Date() && assignment.status === 'published';
  }

  getTypeClass(type: string): string {
    const classes: any = {
      homework: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      quiz: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
      midterm: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
      final: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
      project: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      presentation: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800'
    };
    return classes[type] || classes.homework;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      draft: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      published: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      closed: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      graded: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
    };
    return classes[status] || classes.draft;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
