import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-group-list',
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groups Management
              </h1>
              <p class="mt-1 text-gray-600">Organize classes with teachers, subjects, and schedules</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                  </svg>
                  {{ groups.length }} Groups
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <button 
              (click)="exportGroups()" 
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              [disabled]="groups.length === 0"
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
              Add New Group
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
          <span *ngIf="filters.teacherId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Teacher: {{ getTeacherName(filters.teacherId) }}
            <button (click)="removeFilter('teacherId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.subjectId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Subject: {{ getSubjectName(filters.subjectId) }}
            <button (click)="removeFilter('subjectId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.gradeLevel" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Grade: {{ filters.gradeLevel }}
            <button (click)="removeFilter('gradeLevel')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <input 
              class="form-input" 
              placeholder="🔍 Search..." 
              [(ngModel)]="filters.search" 
              (ngModelChange)="onSearchChange($event)" 
            />
          </div>
          
          <!-- Teacher Filter -->
          <div>
            <select class="form-select" [(ngModel)]="filters.teacherId" (ngModelChange)="onFiltersChange()">
              <option value="">All Teachers</option>
              <option *ngFor="let t of teachers" [value]="t.id || t._id">{{ t.fullName || (t.firstName + ' ' + t.lastName) }}</option>
            </select>
          </div>
          
          <!-- Subject Filter -->
          <div>
            <select class="form-select" [(ngModel)]="filters.subjectId" (ngModelChange)="onFiltersChange()">
              <option value="">All Subjects</option>
              <option *ngFor="let s of subjects" [value]="s.id || s._id">{{ s.name }} ({{ s.code }})</option>
            </select>
          </div>
          
          <!-- Grade Filter -->
          <div>
            <select class="form-select" [(ngModel)]="filters.gradeLevel" (ngModelChange)="onFiltersChange()">
              <option value="">All Grades</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" *ngIf="!isLoading">
              <tr *ngFor="let g of groups">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ g.name }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.course?.teacher?.fullName || '—' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.course?.subject?.name || '—' }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <span *ngFor="let s of g.schedule" 
                          class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
                          [ngClass]="getDayColorClass(s.day)">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                      </svg>
                      {{ s.day | titlecase }}: {{ s.startTime }}-{{ s.endTime }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <div class="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200">
                      <svg class="w-4 h-4 mr-1.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                      </svg>
                      <span class="font-bold text-purple-700">{{ g.assignmentCount?.total || 0 }}</span>
                    </div>
                    <div *ngIf="g.assignmentCount?.published > 0" class="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold" title="Published">
                      {{ g.assignmentCount.published }} 📋
                    </div>
                    <div *ngIf="g.assignmentCount?.draft > 0" class="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 text-xs font-semibold" title="Draft">
                      {{ g.assignmentCount.draft }} ✏️
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="relative inline-block text-left">
                    <button (click)="toggleDropdown(g.id || g._id)" class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div *ngIf="openDropdownId === (g.id || g._id)" class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div class="py-1">
                        <button (click)="viewGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">View Details</button>
                        <button (click)="editGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150">Edit Group</button>
                        <div class="border-t border-gray-100"></div>
                        <button (click)="deleteGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150">Delete Group</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody *ngIf="isLoading">
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">Loading...</td>
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
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  isLoading = false;
  openDropdownId: string | null = null;
  private searchDebounce: any;

  filters: any = { search: '', teacherId: '', subjectId: '', gradeLevel: '' };
  readonly grades = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

  teachers: any[] = [];
  subjects: any[] = [];

  constructor(
    private groupService: GroupService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private router: Router,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.teacherService.getTeachers({ page: 1, limit: 100 }).subscribe({
      next: res => { const list = res.data?.teachers || res.data || []; this.teachers = Array.isArray(list) ? list : []; }
    });
    this.subjectService.getSubjects({ page: 1, limit: 100 }).subscribe({
      next: res => { const list = res.data?.subjects || res.data || []; this.subjects = Array.isArray(list) ? list : []; }
    });
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getGroups(this.filters).subscribe({
      next: (res) => {
        if (res.success) {
          if (res.data?.groups) this.groups = res.data.groups; else if (Array.isArray(res.data)) this.groups = res.data; else this.groups = [];
        } else { this.groups = []; }
        this.isLoading = false;
      },
      error: _ => { this.isLoading = false; }
    });
  }

  onFiltersChange(): void { this.loadGroups(); }
  
  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.loadGroups();
    }, 300);
  }

  clearFilters(): void {
    this.filters = { search: '', teacherId: '', subjectId: '', gradeLevel: '' };
    this.loadGroups();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.teacherId || this.filters.subjectId || this.filters.gradeLevel);
  }

  removeFilter(key: 'search' | 'teacherId' | 'subjectId' | 'gradeLevel'): void {
    (this.filters as any)[key] = '';
    this.loadGroups();
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.teachers.find(t => (t.id || t._id) === teacherId);
    return teacher ? (teacher.fullName || (teacher.firstName + ' ' + teacher.lastName)) : 'Unknown';
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => (s.id || s._id) === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown';
  }
  navigateToCreate(): void { this.router.navigate(['/dashboard/groups/new']); }
  viewGroup(g: any): void { this.router.navigate(['/dashboard/groups', g.id || g._id]); }
  editGroup(g: any): void { this.router.navigate(['/dashboard/groups', g.id || g._id, 'edit']); }

  async deleteGroup(g: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Delete Group', message: `Delete ${g.name}?`, confirmText: 'Yes, Delete', cancelText: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    this.groupService.deleteGroup(g.id || g._id).subscribe({ next: _ => this.loadGroups() });
  }

  toggleDropdown(id: string): void { this.openDropdownId = this.openDropdownId === id ? null : id; }
  closeDropdown(): void { this.openDropdownId = null; }
  
  getDayColorClass(day: string): string {
    const dayLower = day.toLowerCase();
    const colorMap: {[key: string]: string} = {
      'sunday': 'bg-purple-100 text-purple-800 border border-purple-300',
      'monday': 'bg-blue-100 text-blue-800 border border-blue-300',
      'tuesday': 'bg-green-100 text-green-800 border border-green-300',
      'wednesday': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'thursday': 'bg-orange-100 text-orange-800 border border-orange-300',
      'friday': 'bg-red-100 text-red-800 border border-red-300',
      'saturday': 'bg-pink-100 text-pink-800 border border-pink-300'
    };
    return colorMap[dayLower] || 'bg-gray-100 text-gray-800 border border-gray-300';
  }

  // Export method
  exportGroups(): void {
    if (this.groups.length === 0) return;
    
    // Create CSV content
    const headers = ['Group Name', 'Code', 'Teacher', 'Subject', 'Grade Level', 'Students', 'Assignments'];
    const csvContent = [
      headers.join(','),
      ...this.groups.map(group => [
        `"${group.name}"`,
        group.code || '',
        `"${group.course?.teacher?.fullName || ''}"`,
        `"${group.course?.subject?.name || ''}"`,
        group.gradeLevel || '',
        group.currentEnrollment || 0,
        group.assignmentCount?.total || 0
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groups_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
