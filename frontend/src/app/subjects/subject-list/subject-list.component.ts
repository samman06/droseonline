import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SubjectService } from '../../services/subject.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section with Enhanced Design -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {{ 'subjects.management' | translate }}
              </h1>
              <p class="mt-1 text-gray-600">{{ 'subjects.managementSubtitle' | translate }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                  </svg>
                    {{ subjects.length }} {{ 'subjects.subjects' | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex items-center gap-3">
            <!-- View Mode Toggle -->
            <div class="inline-flex rounded-lg bg-gray-100 p-1">
              <button 
                (click)="viewMode = 'card'"
                [class]="viewMode === 'card' 
                  ? 'px-3 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium transition-all' 
                  : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
                [title]="'common.cardView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                </svg>
              </button>
              <button 
                (click)="viewMode = 'table'"
                [class]="viewMode === 'table' 
                  ? 'px-3 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium transition-all' 
                  : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
                [title]="'common.tableView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
            
            <button 
              (click)="exportSubjects()" 
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              [disabled]="subjects.length === 0"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {{ 'subjects.exportData' | translate }}
            </button>
            <!-- Only admins can create new subjects -->
            <button 
              *ngIf="isAdmin()"
              (click)="navigateToCreate()" 
              class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ 'subjects.addNewSubject' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Filters Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ 'subjects.filters' | translate }}</h3>
          <button (click)="clearFilters()" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            {{ 'subjects.clearFilters' | translate }}
          </button>
        </div>

        <!-- Active Filter Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {{ 'subjects.search' | translate }}: {{ filters.search }}
            <button (click)="removeFilter('search')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
        </div>

        <!-- Search by Name or Code -->
        <div>
          <input 
            type="text" 
            [(ngModel)]="filters.search" 
            (ngModelChange)="onSearchChange($event)" 
            class="form-input" 
            [placeholder]="'subjects.searchPlaceholder' | translate"
          >
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-500">{{ 'subjects.loadingSubjects' | translate }}</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && subjects.length === 0" class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">{{ 'subjects.noSubjects' | translate }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          <span *ngIf="isAdmin()">{{ 'subjects.getStarted' | translate }}</span>
          <span *ngIf="!isAdmin()">{{ 'subjects.noSubjectsAvailable' | translate }}</span>
        </p>
        <div *ngIf="isAdmin()" class="mt-6">
          <button (click)="navigateToCreate()" class="btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            {{ 'subjects.addSubject' | translate }}
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div *ngIf="!isLoading && subjects.length > 0 && viewMode === 'table'" class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {{ 'subjects.subjectName' | translate }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {{ 'subjects.code' | translate }}
                </th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {{ 'common.actions' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let subject of subjects" class="hover:bg-indigo-50 transition-colors">
                <!-- Subject Name -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-bold text-gray-900">{{ subject.name }}</div>
                    </div>
                  </div>
                </td>

                <!-- Code -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                    {{ subject.code }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      *ngIf="isAdmin()"
                      (click)="editSubject(subject)"
                      class="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
                      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      {{ 'subjects.edit' | translate }}
                    </button>
                    <button 
                      *ngIf="isAdmin()"
                      (click)="deleteSubject(subject)"
                      class="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
                      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      {{ 'subjects.delete' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Card View -->
      <div *ngIf="!isLoading && subjects.length > 0 && viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let subject of subjects" class="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
          <!-- Card Header with Gradient -->
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-white mb-1">{{ subject.name }}</h3>
                <p class="text-sm text-indigo-100 font-mono">{{ subject.code }}</p>
              </div>
              <svg class="w-6 h-6 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-2">
            <!-- Only admins can edit/delete subjects -->
            <button 
              *ngIf="isAdmin()"
              (click)="editSubject(subject)" 
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200"
              title="Edit Subject"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              {{ 'subjects.edit' | translate }}
            </button>
            <button 
              *ngIf="isAdmin()"
              (click)="deleteSubject(subject)" 
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
              [title]="'subjects.deleteSubject' | translate"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              {{ 'subjects.delete' | translate }}
            </button>
            <!-- Teachers see read-only view -->
            <span *ngIf="!isAdmin()" class="text-sm text-gray-500 italic">{{ 'subjects.readOnlyAccess' | translate }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200; }
    .form-select { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white; }
    .btn-primary { @apply inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200; }
    .btn-secondary { @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500; }
  `]
})
export class SubjectListComponent implements OnInit {
  subjects: any[] = [];
  isLoading = false;
  private searchDebounce: any;
  currentUser: any;
  viewMode: 'card' | 'table' = 'table';

  filters: any = { search: '', limit: 100 };

  constructor(
    private subjectService: SubjectService, 
    private router: Router, 
    private confirmation: ConfirmationService,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void { this.loadSubjects(); }

  loadSubjects(): void {
    this.isLoading = true;
    const params = { ...this.filters };
    this.subjectService.getSubjects(params).subscribe({
      next: res => {
        if (res.success) {
          if (res.data && res.data.subjects) this.subjects = res.data.subjects;
          else if (Array.isArray(res.data)) this.subjects = res.data;
          else this.subjects = [];
        } else { this.subjects = []; }
        this.isLoading = false;
      },
      error: _ => { this.isLoading = false; }
    });
  }
  
  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.loadSubjects();
    }, 300);
  }

  clearFilters(): void {
    this.filters = { search: '', limit: 100 };
    this.loadSubjects();
  }

  hasActiveFilters(): boolean {
    return !!this.filters.search;
  }

  removeFilter(key: 'search'): void {
    (this.filters as any)[key] = '';
    this.loadSubjects();
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  navigateToCreate(): void { this.router.navigate(['/dashboard/subjects/new']); }
  editSubject(s: any): void { this.router.navigate(['/dashboard/subjects', s.id || s._id, 'edit']); }

  async deleteSubject(s: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('subjects.deleteSubject'),
      message: this.translate.instant('subjects.deleteConfirmMessage', { name: s.name }),
      confirmText: this.translate.instant('subjects.yesDelete'),
      cancelText: this.translate.instant('common.cancel'),
      type: 'danger'
    });
    if (!confirmed) return;
    this.subjectService.deleteSubject(s.id || s._id).subscribe({ next: _ => this.loadSubjects() });
  }

  // Export method
  exportSubjects(): void {
    if (this.subjects.length === 0) return;
    
    // Create CSV content
    const headers = [
      this.translate.instant('subjects.code'),
      this.translate.instant('subjects.subjectName'),
      this.translate.instant('subjects.createdDate')
    ];
    const csvContent = [
      headers.join(','),
      ...this.subjects.map(subject => [
        subject.code,
        `"${subject.name}"`,
        new Date(subject.createdAt || Date.now()).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subjects_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
