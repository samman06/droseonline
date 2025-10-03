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
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Groups Management</h1>
          <p class="text-gray-600">Weekly groups with teacher, subject, and grade filter</p>
        </div>
        <button (click)="navigateToCreate()" class="btn-primary">Add Group</button>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input class="form-input" placeholder="🔍 Search..." [(ngModel)]="filters.search" (ngModelChange)="onFiltersChange()" />
          <select class="form-select" [(ngModel)]="filters.teacherId" (ngModelChange)="onFiltersChange()">
            <option value="">All Teachers</option>
            <option *ngFor="let t of teachers" [value]="t.id || t._id">{{ t.fullName || (t.firstName + ' ' + t.lastName) }}</option>
          </select>
          <select class="form-select" [(ngModel)]="filters.subjectId" (ngModelChange)="onFiltersChange()">
            <option value="">All Subjects</option>
            <option *ngFor="let s of subjects" [value]="s.id || s._id">{{ s.name }} ({{ s.code }})</option>
          </select>
          <select class="form-select" [(ngModel)]="filters.gradeLevel" (ngModelChange)="onFiltersChange()">
            <option value="">All Grades</option>
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
          <select class="form-select" [(ngModel)]="filters.isActive" (ngModelChange)="onFiltersChange()">
            <option value="">All Status</option>
            <option value="true">✓ Active</option>
            <option value="false">✗ Inactive</option>
          </select>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" *ngIf="!isLoading">
              <tr *ngFor="let g of groups">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ g.name }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.teacher?.fullName || '—' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.subject?.name || '—' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.gradeLevel }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let s of g.schedule" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {{ s.day | titlecase }} {{ s.startTime }}-{{ s.endTime }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ g.pricePerSession | currency:'EGP':'symbol-narrow' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="g.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
                    <span class="w-2 h-2 rounded-full mr-2" [class]="g.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
                    {{ g.isActive ? 'Active' : 'Inactive' }}
                  </span>
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
                        <button *ngIf="!g.isActive" (click)="activate(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors duration-150">Activate</button>
                        <button *ngIf="g.isActive" (click)="deactivate(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors duration-150">Deactivate</button>
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
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">Loading...</td>
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
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  isLoading = false;
  openDropdownId: string | null = null;

  filters: any = { search: '', teacherId: '', subjectId: '', gradeLevel: '', isActive: '' };
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
    this.teacherService.getTeachers({ isActive: 'true', page: 1, limit: 100 }).subscribe({
      next: res => { const list = res.data?.teachers || res.data || []; this.teachers = Array.isArray(list) ? list : []; }
    });
    this.subjectService.getSubjects({ isActive: 'true', page: 1, limit: 100 }).subscribe({
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

  async activate(g: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Activate Group', message: `Activate ${g.name}?`, confirmText: 'Yes, Activate', cancelText: 'Cancel', type: 'info' });
    if (!confirmed) return;
    this.groupService.updateGroup(g.id || g._id, { isActive: true }).subscribe({ next: _ => this.loadGroups() });
  }

  async deactivate(g: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Deactivate Group', message: `Deactivate ${g.name}?`, confirmText: 'Yes, Deactivate', cancelText: 'Cancel', type: 'warning' });
    if (!confirmed) return;
    this.groupService.updateGroup(g.id || g._id, { isActive: false }).subscribe({ next: _ => this.loadGroups() });
  }
}
