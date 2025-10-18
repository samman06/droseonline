import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { GroupService } from '../../services/group.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-attendance-mark',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <a routerLink="/attendance" class="hover:text-purple-600 transition-colors">Attendance</a>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900 font-medium">Mark Attendance</span>
        </nav>

        <!-- Group Selection (if no groupId) -->
        <div *ngIf="!groupId" class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Select a Group</h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-2">Choose Group to Mark Attendance</label>
              
              <!-- Searchable Dropdown -->
              <div class="relative">
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="groupSearchTerm"
                    (focus)="showGroupDropdown = true"
                    (input)="filterGroups()"
                    placeholder="Search groups..."
                    class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                
                <!-- Dropdown List -->
                <div *ngIf="showGroupDropdown && filteredGroups.length > 0" 
                     class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  <button
                    *ngFor="let g of filteredGroups"
                    type="button"
                    (click)="selectGroup(g)"
                    class="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-purple-50"
                  >
                    <div class="font-semibold text-gray-900">{{ g.name }}</div>
                    <div class="text-sm text-gray-600 mt-1">
                      <span class="inline-flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        {{ g.subject?.name || 'N/A' }}
                      </span>
                      <span class="mx-2">•</span>
                      <span class="inline-flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        {{ g.teacher?.fullName || 'N/A' }}
                      </span>
                      <span class="mx-2">•</span>
                      <span class="text-purple-600">{{ g.gradeLevel }}</span>
                    </div>
                  </button>
                </div>
                
                <!-- No Results -->
                <div *ngIf="showGroupDropdown && filteredGroups.length === 0 && groupSearchTerm" 
                     class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-4 text-center text-gray-500">
                  No groups found matching "{{ groupSearchTerm }}"
                </div>
              </div>
            </div>
            <div *ngIf="selectedGroup" class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Teacher</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.teacher?.fullName || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Subject</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.subject?.name || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Grade Level</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.gradeLevel }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Total Students</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.students?.length || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p class="mt-4 text-gray-600 font-medium">Loading group details...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ error }}</p>
          </div>
        </div>

        <!-- Main Attendance Form -->
        <div *ngIf="!isLoading && !error && group">
          <!-- Hero Section -->
          <div class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
            <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
            <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            
            <div class="relative z-10">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div class="flex-1">
                  <h1 class="text-4xl font-bold text-white mb-2">{{ group.name }}</h1>
                  <p class="text-purple-100 text-lg mb-4">Mark Attendance for {{ sessionDate | date:'fullDate' }}</p>
                  <div class="flex flex-wrap gap-4 text-sm text-purple-100">
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span>{{ group.teacher?.fullName || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                      <span>{{ group.subject?.name || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span>{{ students.length }} Students</span>
                    </div>
                  </div>
                </div>

                <!-- Real-time Stats -->
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div class="text-center">
                    <div class="text-5xl font-bold text-white mb-2">{{ attendanceRate }}%</div>
                    <div class="text-purple-100 text-sm">Attendance Rate</div>
                    <div class="mt-3 flex items-center justify-center gap-2 text-xs text-purple-100">
                      <span class="px-2 py-1 bg-green-500/30 rounded">{{ getStatusCount('present') }} Present</span>
                      <span class="px-2 py-1 bg-yellow-500/30 rounded">{{ getStatusCount('late') }} Late</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Bar -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div class="text-sm text-gray-600">
                Marked: <span class="font-semibold">{{ getMarkedCount() }}</span> / {{ students.length }}
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <button 
                (click)="markAllPresent()"
                class="px-6 py-3 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Mark All Present
              </button>
              <button 
                (click)="markAllAbsent()"
                class="px-6 py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Mark All Absent
              </button>
              <button 
                (click)="clearAll()"
                class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <!-- Students Grid -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Student Attendance</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let student of students; let i = index" 
                   class="bg-gradient-to-br from-gray-50 to-white border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                   [ngClass]="{
                     'border-green-300 bg-green-50/50': student.status === 'present',
                     'border-red-300 bg-red-50/50': student.status === 'absent',
                     'border-yellow-300 bg-yellow-50/50': student.status === 'late',
                     'border-blue-300 bg-blue-50/50': student.status === 'excused',
                     'border-gray-200': !student.status
                   }">
                
                <!-- Student Header -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-purple-600 font-bold text-lg">{{ getInitials(student.student?.fullName || 'N/A') }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-gray-900 truncate">{{ student.student?.fullName || 'N/A' }}</h3>
                    <p class="text-xs text-gray-500">ID: {{ student.student?.academicInfo?.studentId || 'N/A' }}</p>
                  </div>
                </div>

                <!-- Status Buttons -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <button 
                    (click)="setStatus(i, 'present')"
                    [ngClass]="{
                      'bg-green-500 text-white shadow-lg': student.status === 'present',
                      'bg-green-50 text-green-700 hover:bg-green-100': student.status !== 'present'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Present
                  </button>
                  <button 
                    (click)="setStatus(i, 'absent')"
                    [ngClass]="{
                      'bg-red-500 text-white shadow-lg': student.status === 'absent',
                      'bg-red-50 text-red-700 hover:bg-red-100': student.status !== 'absent'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Absent
                  </button>
                  <button 
                    (click)="setStatus(i, 'late')"
                    [ngClass]="{
                      'bg-yellow-500 text-white shadow-lg': student.status === 'late',
                      'bg-yellow-50 text-yellow-700 hover:bg-yellow-100': student.status !== 'late'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Late
                  </button>
                  <button 
                    (click)="setStatus(i, 'excused')"
                    [ngClass]="{
                      'bg-blue-500 text-white shadow-lg': student.status === 'excused',
                      'bg-blue-50 text-blue-700 hover:bg-blue-100': student.status !== 'excused'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Excused
                  </button>
                </div>

                <!-- Late Minutes (if late) -->
                <div *ngIf="student.status === 'late'" class="mb-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Minutes Late</label>
                  <input 
                    type="number"
                    [(ngModel)]="student.minutesLate"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea 
                    [(ngModel)]="student.notes"
                    rows="2"
                    placeholder="Add notes..."
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="students.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p class="mt-2 text-sm text-gray-500">No students enrolled in this group</p>
            </div>
          </div>

          <!-- Session Notes -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Session Notes</h2>
            <textarea 
              [(ngModel)]="sessionNotes"
              rows="4"
              placeholder="Add any notes about this session (optional)..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between bg-white rounded-xl shadow-lg p-6">
            <button 
              (click)="goBack()"
              class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Cancel
            </button>

            <div class="flex gap-3">
              <button 
                (click)="saveAttendance(false)"
                [disabled]="isSaving"
                class="px-6 py-3 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
                Save as Draft
              </button>
              <button 
                (click)="saveAttendance(true)"
                [disabled]="isSaving || !isValid()"
                class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg *ngIf="!isSaving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <svg *ngIf="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSaving ? 'Saving...' : 'Submit Attendance' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceMarkComponent implements OnInit {
  groupId: string | null = null;
  group: any = null;
  students: any[] = [];
  sessionDate: Date = new Date();
  sessionNotes: string = '';
  isLoading = false;
  isSaving = false;
  error: string = '';

  // For group selection
  selectedGroupId: string = '';
  selectedGroup: any = null;
  allGroups: any[] = [];
  filteredGroups: any[] = [];
  groupSearchTerm: string = '';
  showGroupDropdown: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private groupService: GroupService,
    private toastService: ToastService
  ) {}

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showGroupDropdown = false;
    }
  }

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    
    if (this.groupId) {
      this.loadGroup(this.groupId);
    } else {
      this.loadAllGroups();
    }
  }

  loadAllGroups() {
    this.groupService.getGroups({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.allGroups = response.success ? response.data.groups : response.groups || [];
        this.filteredGroups = [...this.allGroups];
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.toastService.error('Failed to load groups');
      }
    });
  }

  filterGroups() {
    if (!this.groupSearchTerm.trim()) {
      this.filteredGroups = [...this.allGroups];
    } else {
      const searchLower = this.groupSearchTerm.toLowerCase();
      this.filteredGroups = this.allGroups.filter(group => 
        group.name?.toLowerCase().includes(searchLower) ||
        group.code?.toLowerCase().includes(searchLower) ||
        group.subject?.name?.toLowerCase().includes(searchLower) ||
        group.teacher?.fullName?.toLowerCase().includes(searchLower) ||
        group.gradeLevel?.toLowerCase().includes(searchLower)
      );
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;
    this.selectedGroupId = group._id;
    this.groupSearchTerm = group.name;
    this.showGroupDropdown = false;
    this.loadGroup(group._id);
  }

  onGroupSelect() {
    if (this.selectedGroupId) {
      this.selectedGroup = this.allGroups.find(g => g._id === this.selectedGroupId);
      this.loadGroup(this.selectedGroupId);
    }
  }

  loadGroup(groupId: string) {
    this.isLoading = true;
    this.error = '';

    this.groupService.getGroup(groupId).subscribe({
      next: (response: any) => {
        const groupData = response.success ? response.data.group : response.group || response;
        this.group = groupData;
        this.initializeStudents();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading group:', error);
        this.error = error.error?.message || 'Failed to load group details';
        this.isLoading = false;
        this.toastService.error(this.error);
      }
    });
  }

  initializeStudents() {
    if (!this.group || !this.group.students) {
      this.students = [];
      return;
    }

    this.students = this.group.students.map((enrollment: any) => ({
      student: enrollment.student || enrollment,
      status: '',
      minutesLate: 0,
      notes: ''
    }));
  }

  setStatus(index: number, status: string) {
    if (this.students[index]) {
      this.students[index].status = status;
      if (status !== 'late') {
        this.students[index].minutesLate = 0;
      }
    }
  }

  markAllPresent() {
    this.students.forEach(student => {
      student.status = 'present';
      student.minutesLate = 0;
    });
    this.toastService.success('All students marked as present');
  }

  markAllAbsent() {
    this.students.forEach(student => {
      student.status = 'absent';
      student.minutesLate = 0;
    });
    this.toastService.success('All students marked as absent');
  }

  clearAll() {
    this.students.forEach(student => {
      student.status = '';
      student.minutesLate = 0;
      student.notes = '';
    });
    this.toastService.info('All attendance cleared');
  }

  getStatusCount(status: string): number {
    return this.students.filter(s => s.status === status).length;
  }

  getMarkedCount(): number {
    return this.students.filter(s => s.status).length;
  }

  get attendanceRate(): number {
    const marked = this.getMarkedCount();
    if (marked === 0 || this.students.length === 0) return 0;
    
    const present = this.getStatusCount('present');
    const late = this.getStatusCount('late');
    return Math.round(((present + late) / marked) * 100);
  }

  isValid(): boolean {
    // All students must have a status
    return this.students.every(s => s.status);
  }

  saveAttendance(markAsComplete: boolean) {
    if (!this.group) return;

    if (markAsComplete && !this.isValid()) {
      this.toastService.warning('Please mark attendance for all students before submitting');
      return;
    }

    this.isSaving = true;

    const attendanceRecords = this.students
      .filter(s => s.status) // Only include marked students
      .map(s => ({
        studentId: s.student._id || s.student,
        status: s.status,
        minutesLate: s.status === 'late' ? (s.minutesLate || 0) : 0,
        notes: s.notes || ''
      }));

    const data = {
      groupId: this.group._id,
      sessionDate: this.sessionDate,
      scheduleIndex: 0,
      records: attendanceRecords,
      sessionNotes: this.sessionNotes,
      isCompleted: markAsComplete
    };

    this.attendanceService.createAttendance(data).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (markAsComplete) {
          this.toastService.success('Attendance submitted successfully');
        } else {
          this.toastService.success('Attendance saved as draft');
        }
        this.router.navigate(['/attendance']);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error saving attendance:', error);
        this.toastService.error(error.error?.message || 'Failed to save attendance');
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  goBack() {
    this.router.navigate(['/attendance']);
  }
}
