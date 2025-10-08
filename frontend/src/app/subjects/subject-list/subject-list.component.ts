import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SubjectService } from '../../services/subject.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
                Subjects Management
              </h1>
              <p class="mt-1 text-gray-600">Manage academic subjects, courses, and curriculum</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                  </svg>
                  {{ subjects.length }} Total
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {{ getActiveSubjectsCount() }} Active
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <button 
              (click)="exportSubjects()" 
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              [disabled]="subjects.length === 0"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export Data
            </button>
            <button (click)="navigateToCreate()" class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add New Subject
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Filters Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">Filters</h3>
          <button (click)="clearFilters()" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            Clear Filters
          </button>
        </div>

        <!-- Active Filter Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Search: {{ filters.search }}
            <button (click)="removeFilter('search')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.isActive" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Status: {{ filters.isActive === 'true' ? 'Active' : 'Inactive' }}
            <button (click)="removeFilter('isActive')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Search by Name or Code -->
          <div>
            <input 
              type="text" 
              [(ngModel)]="filters.search" 
              (ngModelChange)="onSearchChange($event)" 
              class="form-input" 
              placeholder="🔍 Search by name or code..."
            >
          </div>
          
          <!-- Status Filter -->
          <div>
            <select 
              [(ngModel)]="filters.isActive" 
              (ngModelChange)="onFiltersChange()" 
              class="form-select"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" *ngIf="!isLoading">
              <tr *ngFor="let subject of subjects">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ subject.name }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ subject.code }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span *ngIf="subject.isActive" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300 shadow-sm hover:shadow-md transition-all duration-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="tracking-wide">ACTIVE</span>
                  </span>
                  <span *ngIf="!subject.isActive" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border-2 border-red-300 shadow-sm hover:shadow-md transition-all duration-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <span class="tracking-wide">INACTIVE</span>
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="relative inline-block text-left">
                    <button (click)="toggleDropdown(subject.id)" class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div *ngIf="openDropdownId === subject.id" class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div class="py-1">
                        <button (click)="viewSubject(subject); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                          View Details
                        </button>
                        <button (click)="editSubject(subject); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150">
                          Edit Subject
                        </button>
                        <button *ngIf="!subject.isActive" (click)="activate(subject); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors duration-150">Activate</button>
                        <button *ngIf="subject.isActive" (click)="deactivate(subject); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors duration-150">Deactivate</button>
                        <div class="border-t border-gray-100"></div>
                        <button (click)="deleteSubject(subject); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150">
                          Delete Subject
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody *ngIf="isLoading">
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            </tbody>
          </table>
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
  openDropdownId: string | null = null;
  private searchDebounce: any;

  filters: any = { search: '', isActive: '', limit: 100 };

  // Grades removed

  constructor(private subjectService: SubjectService, private router: Router, private confirmation: ConfirmationService) {}

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

  onFiltersChange(): void { this.loadSubjects(); }
  
  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.loadSubjects();
    }, 300);
  }

  clearFilters(): void {
    this.filters = { search: '', isActive: '', limit: 100 };
    this.loadSubjects();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.isActive);
  }

  removeFilter(key: 'search' | 'isActive'): void {
    (this.filters as any)[key] = '';
    this.loadSubjects();
  }
  navigateToCreate(): void { this.router.navigate(['/dashboard/subjects/new']); }
  viewSubject(s: any): void { this.router.navigate(['/dashboard/subjects', s.id || s._id]); }
  editSubject(s: any): void { this.router.navigate(['/dashboard/subjects', s.id || s._id, 'edit']); }

  async deleteSubject(s: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete ${s.name}? This cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    this.subjectService.deleteSubject(s.id || s._id).subscribe({ next: _ => this.loadSubjects() });
  }

  toggleDropdown(id: string): void { this.openDropdownId = this.openDropdownId === id ? null : id; }
  closeDropdown(): void { this.openDropdownId = null; }

  async activate(s: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Activate Subject',
      message: `Activate ${s.name}?`,
      confirmText: 'Yes, Activate',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    this.subjectService.activateSubject(s.id || s._id).subscribe({ next: _ => this.loadSubjects() });
  }

  async deactivate(s: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Deactivate Subject',
      message: `Deactivate ${s.name}?`,
      confirmText: 'Yes, Deactivate',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    this.subjectService.deactivateSubject(s.id || s._id).subscribe({ next: _ => this.loadSubjects() });
  }

  // Statistics methods
  getActiveSubjectsCount(): number {
    return this.subjects.filter(subject => subject.isActive).length;
  }

  // Export method
  exportSubjects(): void {
    if (this.subjects.length === 0) return;
    
    // Create CSV content
    const headers = ['Subject Code', 'Subject Name', 'Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...this.subjects.map(subject => [
        subject.code,
        `"${subject.name}"`,
        subject.isActive ? 'Active' : 'Inactive',
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
