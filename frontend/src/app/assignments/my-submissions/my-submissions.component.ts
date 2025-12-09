import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AssignmentService } from '../../services/assignment.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Enhanced Header Section -->
      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-white bg-opacity-20 rounded-xl">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold">{{ 'assignments.mySubmissions' | translate }}</h1>
              <p class="mt-1 text-purple-100">{{ 'assignments.trackProgress' | translate }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-4xl font-bold">{{ submissions.length }}</div>
            <div class="text-purple-200 text-sm">{{ 'assignments.totalSubmissions' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-green-600 uppercase tracking-wide">{{ 'assignments.graded2' | translate }}</p>
              <p class="text-3xl font-bold text-green-900 mt-2">{{ getGradedCount() }}</p>
            </div>
            <div class="p-3 bg-green-200 rounded-lg">
              <svg class="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-blue-600 uppercase tracking-wide">{{ 'assignments.pending' | translate }}</p>
              <p class="text-3xl font-bold text-blue-900 mt-2">{{ getPendingCount() }}</p>
            </div>
            <div class="p-3 bg-blue-200 rounded-lg">
              <svg class="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-yellow-600 uppercase tracking-wide">{{ 'assignments.late' | translate }}</p>
              <p class="text-3xl font-bold text-yellow-900 mt-2">{{ getLateCount() }}</p>
            </div>
            <div class="p-3 bg-yellow-200 rounded-lg">
              <svg class="w-6 h-6 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-purple-600 uppercase tracking-wide">{{ 'assignments.avgGrade' | translate }}</p>
              <p class="text-3xl font-bold text-purple-900 mt-2">{{ getAverageGrade() }}%</p>
            </div>
            <div class="p-3 bg-purple-200 rounded-lg">
              <svg class="w-6 h-6 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'common.search' | translate }}</label>
            <input 
              type="text" 
              [(ngModel)]="filters.search" 
              (input)="applyFilters()"
              [placeholder]="'assignments.searchAssignments' | translate" 
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'assignments.status' | translate }}</label>
            <select [(ngModel)]="filters.status" (change)="applyFilters()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
              <option value="">{{ 'assignments.allStatuses' | translate }}</option>
              <option value="draft">{{ 'assignments.statuses.draft' | translate }}</option>
              <option value="submitted">{{ 'assignments.statuses.submitted' | translate }}</option>
              <option value="late">{{ 'assignments.statuses.late' | translate }}</option>
              <option value="graded">{{ 'assignments.statuses.graded' | translate }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'assignments.sortBy' | translate }}</label>
            <select [(ngModel)]="sortBy" (change)="applyFilters()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
              <option value="dueDate">{{ 'assignments.dueDate' | translate }}</option>
              <option value="submittedAt">{{ 'assignments.submissionDate' | translate }}</option>
              <option value="grade">{{ 'assignments.grade' | translate }}</option>
              <option value="title">{{ 'assignments.title' | translate }}</option>
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        <div *ngIf="hasActiveFilters()" class="mt-4 flex items-center space-x-2">
          <span class="text-sm text-gray-600 font-medium">{{ 'assignments.activeFilters' | translate }}:</span>
          <button *ngIf="filters.status" (click)="filters.status = ''; applyFilters()" 
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200">
            {{ 'assignments.status' | translate }}: {{ filters.status }}
            <svg class="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
          <button (click)="clearFilters()" class="text-sm text-purple-600 hover:text-purple-800 font-medium">
            {{ 'assignments.clearAll' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>

      <!-- Submissions List -->
      <div *ngIf="!loading && filteredSubmissions.length > 0" class="space-y-4">
        <div *ngFor="let submission of filteredSubmissions" 
             class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Assignment Title & Code -->
                <div class="flex items-center space-x-3 mb-3">
                  <h3 class="text-lg font-bold text-gray-900">{{ submission.assignment?.title }}</h3>
                  <span class="text-sm text-gray-500 font-mono">{{ submission.assignment?.code }}</span>
                </div>

                <!-- Status & Type Badges -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                        [ngClass]="{
                          'bg-green-100 text-green-700': submission.status === 'graded',
                          'bg-blue-100 text-blue-700': submission.status === 'submitted',
                          'bg-yellow-100 text-yellow-700': submission.status === 'draft',
                          'bg-red-100 text-red-700': submission.status === 'late'
                        }">
                    {{ submission.status | titlecase }}
                  </span>
                  <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                    {{ submission.assignment?.type | titlecase }}
                  </span>
                  <span *ngIf="submission.isLate" class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                    ⏰ {{ 'assignments.lateSubmission' | translate }}
                  </span>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.dueDate' | translate }}</p>
                      <p class="text-sm font-medium text-gray-900">{{ submission.assignment?.dueDate | date:'short' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.maxPoints' | translate }}</p>
                      <p class="text-sm font-medium text-gray-900">{{ submission.assignment?.maxPoints }}</p>
                    </div>
                  </div>
                  <div *ngIf="submission.submittedAt" class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.submitted' | translate }}</p>
                      <p class="text-sm font-medium text-gray-900">{{ submission.submittedAt | date:'short' }}</p>
                    </div>
                  </div>
                  <div *ngIf="submission.grade" class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.grade' | translate }}</p>
                      <p class="text-sm font-bold text-gray-900">{{ submission.grade?.pointsEarned }} / {{ submission.assignment?.maxPoints }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Button -->
              <div class="ml-6">
                <a [routerLink]="['/dashboard/assignments', submission.assignment?._id]"
                   class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md">
                  {{ 'common.viewDetails' | translate }}
                  <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Feedback (if graded) -->
            <div *ngIf="submission.grade?.feedback" class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-sm font-semibold text-gray-700 mb-2">{{ 'assignments.teacherFeedback' | translate }}:</p>
              <p class="text-sm text-gray-600 italic">{{ submission.grade.feedback }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredSubmissions.length === 0" class="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">
        <div class="text-center">
          <div class="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">{{ 'assignments.noSubmissionsFound' | translate }}</h3>
          <p class="text-gray-600 mb-6">
            {{ (hasActiveFilters() ? 'assignments.tryAdjustingFilters' : 'assignments.noSubmissionsYet') | translate }}
          </p>
          <a [routerLink]="['/dashboard/assignments']" 
             class="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md">
            {{ 'assignments.browseAssignments' | translate }}
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MySubmissionsComponent implements OnInit {
  submissions: any[] = [];
  filteredSubmissions: any[] = [];
  loading = false;
  currentUser: any;
  
  filters = {
    search: '',
    status: ''
  };
  
  sortBy = 'dueDate';

  constructor(
    private assignmentService: AssignmentService,
    private authService: AuthService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading = true;
    
    // This will get assignments with submission status for the student
    this.assignmentService.getAssignments({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as any;
          // The API returns assignments with submission info for students
          this.submissions = data.assignments || data || [];
          // Filter to only show assignments that have been submitted
          this.submissions = this.submissions.filter((a: any) => a.submission);
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.toastService.showApiError(error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.submissions];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.assignment?.title?.toLowerCase().includes(search) ||
        s.assignment?.code?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(s => s.submission?.status === this.filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'dueDate':
          return new Date(b.assignment?.dueDate || 0).getTime() - new Date(a.assignment?.dueDate || 0).getTime();
        case 'submittedAt':
          return new Date(b.submission?.submittedAt || 0).getTime() - new Date(a.submission?.submittedAt || 0).getTime();
        case 'grade':
          return (b.submission?.grade?.pointsEarned || 0) - (a.submission?.grade?.pointsEarned || 0);
        case 'title':
          return (a.assignment?.title || '').localeCompare(b.assignment?.title || '');
        default:
          return 0;
      }
    });

    this.filteredSubmissions = filtered;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.status);
  }

  clearFilters(): void {
    this.filters = { search: '', status: '' };
    this.applyFilters();
  }

  getGradedCount(): number {
    return this.submissions.filter(s => s.submission?.status === 'graded').length;
  }

  getPendingCount(): number {
    return this.submissions.filter(s => 
      s.submission?.status === 'submitted' && !s.submission?.grade
    ).length;
  }

  getLateCount(): number {
    return this.submissions.filter(s => s.submission?.isLate).length;
  }

  getAverageGrade(): number {
    const graded = this.submissions.filter(s => s.submission?.grade?.pointsEarned != null);
    if (graded.length === 0) return 0;
    
    const total = graded.reduce((sum, s) => {
      const earned = s.submission.grade.pointsEarned;
      const max = s.assignment.maxPoints;
      return sum + (max > 0 ? (earned / max) * 100 : 0);
    }, 0);
    
    return Math.round(total / graded.length);
  }
}

