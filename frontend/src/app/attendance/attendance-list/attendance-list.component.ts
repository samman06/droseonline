import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { GroupService } from '../../services/group.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-indigo-600">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Attendance Records</h1>
              <p class="text-gray-600">Track and manage student attendance</p>
            </div>
            <div class="flex gap-3">
              <button 
                (click)="exportData()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export
              </button>
              <button 
                (click)="showPendingGroups()"
                class="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pending Today ({{ pendingCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select 
                [(ngModel)]="filters.groupId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Groups</option>
                <option *ngFor="let group of groups" [value]="group._id">{{ group.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
              <select 
                [(ngModel)]="filters.teacherId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Teachers</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">{{ teacher.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                [(ngModel)]="filters.subjectId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                <option *ngFor="let subject of subjects" [value]="subject._id">{{ subject.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                [(ngModel)]="filters.isCompleted"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input 
                type="date" 
                [(ngModel)]="filters.dateFrom"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input 
                type="date" 
                [(ngModel)]="filters.dateTo"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Pending Groups Modal -->
        <div *ngIf="showPending" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">Groups Pending Attendance Today</h2>
                <button 
                  (click)="showPending = false"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-6">
              <div *ngIf="pendingGroups.length === 0" class="text-center py-8">
                <svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-gray-600">All attendance marked for today! 🎉</p>
              </div>
              <div *ngIf="pendingGroups.length > 0" class="space-y-3">
                <div *ngFor="let group of pendingGroups" 
                     class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <p class="font-semibold text-gray-900 text-lg">{{ group.name }}</p>
                        <span *ngIf="group.gradeLevel" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {{ group.gradeLevel }}
                        </span>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                          </svg>
                          <span>{{ group.teacher?.fullName || 'No teacher' }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                          </svg>
                          <span>{{ group.subject?.name || 'No subject' }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                          </svg>
                          <span>{{ group.studentCount || 0 }} students</span>
                        </div>
                      </div>
                      <div class="flex gap-2 flex-wrap">
                        <span *ngFor="let s of group.schedule" class="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                          🕐 {{ s.day | titlecase }} • {{ s.startTime }} - {{ s.endTime }}
                        </span>
                      </div>
                    </div>
                    <button 
                      (click)="markAttendance(group._id)"
                      class="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      ✓ Mark Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p class="mt-4 text-gray-600">Loading attendance records...</p>
        </div>

        <!-- Attendance Table -->
        <div *ngIf="!isLoading" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Group</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Teacher</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Subject</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Attendance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Lock</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let attendance of attendances" class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ attendance.session.date | date:'MMM d, y' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ attendance.group?.name }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ attendance.teacher?.fullName }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ attendance.subject?.name }}</td>
                <td class="px-6 py-4 text-sm">
                  <div class="flex gap-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ {{ attendance.stats?.present || 0 }}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⏰ {{ attendance.stats?.late || 0 }}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✗ {{ attendance.stats?.absent || 0 }}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      E {{ attendance.stats?.excused || 0 }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Rate: {{ attendance.stats?.rate || 0 }}%</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm"
                    [class]="attendance.isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'"
                  >
                    <span class="w-2 h-2 rounded-full mr-2 bg-white" [class.animate-pulse]="!attendance.isCompleted"></span>
                    {{ attendance.isCompleted ? 'Completed' : 'Incomplete' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    *ngIf="attendance.isLocked"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                  >
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                    </svg>
                    Locked
                  </span>
                  <span 
                    *ngIf="!attendance.isLocked"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                  >
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                    </svg>
                    Unlocked
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="relative inline-block text-left">
                    <button 
                      (click)="toggleDropdown(attendance._id)"
                      class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                    <div *ngIf="openDropdownId === attendance._id" class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div class="py-1">
                        <a 
                          [routerLink]="['/dashboard/attendance', attendance._id]"
                          class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                        >
                          <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          View Details
                        </a>
                        <a 
                          [routerLink]="['/dashboard/attendance/edit', attendance._id]"
                          class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                        >
                          <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                          Edit
                        </a>
                        <button 
                          (click)="deleteAttendance(attendance._id)"
                          class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div *ngIf="attendances.length === 0" class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-gray-600">No attendance records found</p>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination.totalPages > 1" class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to 
              {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }} of 
              {{ pagination.totalItems }} results
            </div>
            <div class="flex gap-2">
              <button 
                (click)="changePage(pagination.currentPage - 1)"
                [disabled]="pagination.currentPage === 1"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <button 
                (click)="changePage(pagination.currentPage + 1)"
                [disabled]="pagination.currentPage === pagination.totalPages"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceListComponent implements OnInit {
  attendances: any[] = [];
  groups: any[] = [];
  teachers: any[] = [];
  subjects: any[] = [];
  pendingGroups: any[] = [];
  pendingCount: number = 0;
  showPending: boolean = false;
  
  // Cache flags to prevent duplicate API calls
  private groupsLoaded = false;
  private teachersLoaded = false;
  private subjectsLoaded = false;
  
  filters = {
    groupId: '',
    teacherId: '',
    subjectId: '',
    dateFrom: '',
    dateTo: '',
    isCompleted: '',
    page: 1,
    limit: 10
  };

  pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  };

  isLoading = false;
  openDropdownId: string | null = null;
  Math = Math;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private groupService: GroupService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAttendances();
    this.loadGroups();
    this.loadTeachers();
    this.loadSubjects();
    this.loadPendingGroups();
  }

  loadAttendances(): void {
    this.isLoading = true;
    this.attendanceService.getAttendances(this.filters).subscribe({
      next: (response) => {
        this.attendances = response.attendances;
        this.pagination = response.pagination;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading attendances:', err);
        this.isLoading = false;
      }
    });
  }

  loadGroups(): void {
    // Prevent duplicate API calls
    if (this.groupsLoaded) {
      console.log('Groups already loaded, skipping API call');
      return;
    }
    
    this.groupService.getGroups({ page: 1, limit: 100, isActive: 'true' }).subscribe({
      next: (response: any) => {
        console.log('Groups response:', response);
        // Handle nested structure: response.data.groups
        this.groups = response.data?.groups || response.groups || [];
        this.groupsLoaded = true;
      },
      error: (err) => console.error('Error loading groups:', err)
    });
  }

  loadTeachers(): void {
    // Prevent duplicate API calls
    if (this.teachersLoaded) {
      console.log('Teachers already loaded, skipping API call');
      return;
    }
    
    this.teacherService.getTeachers({ page: 1, limit: 100, isActive: 'true' }).subscribe({
      next: (response: any) => {
        console.log('Teachers response:', response);
        // Handle nested structure: response.data.teachers
        this.teachers = response.data?.teachers || response.teachers || [];
        this.teachersLoaded = true;
      },
      error: (err) => console.error('Error loading teachers:', err)
    });
  }

  loadSubjects(): void {
    // Prevent duplicate API calls
    if (this.subjectsLoaded) {
      console.log('Subjects already loaded, skipping API call');
      return;
    }
    
    this.subjectService.getSubjects({ page: 1, limit: 100, isActive: 'true' }).subscribe({
      next: (response: any) => {
        console.log('Subjects response:', response);
        // Handle nested structure: response.data.subjects
        this.subjects = response.data?.subjects || response.subjects || [];
        this.subjectsLoaded = true;
      },
      error: (err) => console.error('Error loading subjects:', err)
    });
  }

  loadPendingGroups(): void {
    this.attendanceService.getPendingAttendance().subscribe({
      next: (response) => {
        console.log('✅ Pending groups response:', response);
        this.pendingGroups = response.pendingGroups || [];
        this.pendingCount = response.count || 0;
      },
      error: (err) => {
        console.error('❌ Error loading pending groups:', err);
        this.pendingGroups = [];
        this.pendingCount = 0;
      }
    });
  }

  showPendingGroups(): void {
    this.showPending = true;
  }

  markAttendance(groupId: string): void {
    this.router.navigate(['/dashboard/attendance/mark', groupId]);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadAttendances();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadAttendances();
  }

  toggleDropdown(id: string): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  exportData(): void {
    const exportParams: any = {};
    if (this.filters.groupId) exportParams.groupId = this.filters.groupId;
    if (this.filters.dateFrom) exportParams.dateFrom = this.filters.dateFrom;
    if (this.filters.dateTo) exportParams.dateTo = this.filters.dateTo;
    exportParams.format = 'csv';

    this.attendanceService.exportAttendance(exportParams).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting attendance:', err);
      }
    });
  }

  async deleteAttendance(id: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Attendance Record',
      message: 'Are you sure you want to delete this attendance record? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    this.attendanceService.deleteAttendance(id).subscribe({
      next: () => {
        this.loadAttendances();
      },
      error: (err) => {
        console.error('Error deleting attendance:', err);
      }
    });
  }
}