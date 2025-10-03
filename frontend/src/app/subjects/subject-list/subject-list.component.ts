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
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Subjects Management</h1>
            <p class="mt-1 text-gray-600">Manage subjects for Egyptian grades</p>
          </div>
        </div>
        <div class="mt-4 lg:mt-0 flex space-x-3">
          <button (click)="navigateToCreate()" class="btn-primary inline-flex items-center shadow-md hover:shadow-lg transition-all duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Add Subject
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" [(ngModel)]="filters.search" (ngModelChange)="onFiltersChange()" class="form-input" placeholder="🔍 Search by name or code...">
          <!-- Grades removed: subjects are assigned to groups -->
          <select [(ngModel)]="filters.isActive" (ngModelChange)="onFiltersChange()" class="form-select">
            <option value="">All Status</option>
            <option value="true">✓ Active</option>
            <option value="false">✗ Inactive</option>
          </select>
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
                  <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="subject.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
                    <span class="w-2 h-2 rounded-full mr-2" [class]="subject.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
                    {{ subject.isActive ? 'Active' : 'Inactive' }}
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
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">Loading...</td>
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
  `]
})
export class SubjectListComponent implements OnInit {
  subjects: any[] = [];
  isLoading = false;
  openDropdownId: string | null = null;

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
}
