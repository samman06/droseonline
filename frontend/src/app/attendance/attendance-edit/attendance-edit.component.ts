import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-attendance-edit',
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
          <a *ngIf="attendance" [routerLink]="['/attendance', attendance._id]" class="hover:text-purple-600 transition-colors">Details</a>
          <svg *ngIf="attendance" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900 font-medium">Edit</span>
        </nav>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p class="mt-4 text-gray-600 font-medium">Loading attendance...</p>
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

        <!-- Main Edit Form -->
        <div *ngIf="!isLoading && !error && attendance">
          <!-- Hero Section -->
          <div class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
            <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
            <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            
            <div class="relative z-10">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      {{ attendance.code || 'N/A' }}
                    </span>
                    <span *ngIf="attendance.isLocked" 
                          class="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      🔒 Locked
                    </span>
                    <span *ngIf="!attendance.isLocked" 
                          class="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      🔓 Unlocked
                    </span>
                  </div>
                  <h1 class="text-4xl font-bold text-white mb-2">Edit Attendance</h1>
                  <p class="text-purple-100 text-lg mb-4">{{ attendance.group?.name }} - {{ formatDate(attendance.session.date) }}</p>
                  <div class="flex flex-wrap gap-4 text-sm text-purple-100">
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span>{{ attendance.teacher?.fullName }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                      <span>{{ attendance.subject?.name }}</span>
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
                    <div *ngIf="hasChanges" class="mt-3 text-xs text-yellow-200 font-medium">
                      ⚠️ {{ changeCount }} change(s) pending
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lock Warning (if locked and not admin) -->
          <div *ngIf="attendance.isLocked && !isAdmin" class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
              </svg>
              <div>
                <p class="text-yellow-800 font-medium">This attendance session is locked</p>
                <p class="text-yellow-700 text-sm mt-1">Only administrators can edit locked sessions</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions Bar -->
          <div *ngIf="!attendance.isLocked || isAdmin" class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div class="text-sm text-gray-600">
                Students: <span class="font-semibold">{{ students.length }}</span>
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
                (click)="resetChanges()"
                [disabled]="!hasChanges"
                class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Reset Changes
              </button>
            </div>
          </div>

          <!-- Students Grid -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Student Attendance Records</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let student of students; let i = index" 
                   class="bg-gradient-to-br from-gray-50 to-white border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                   [ngClass]="{
                     'border-green-300 bg-green-50/50': student.status === 'present',
                     'border-red-300 bg-red-50/50': student.status === 'absent',
                     'border-yellow-300 bg-yellow-50/50': student.status === 'late',
                     'border-blue-300 bg-blue-50/50': student.status === 'excused',
                     'border-gray-200': !student.status,
                     'ring-2 ring-purple-400': student.changed
                   }">
                
                <!-- Student Header -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-purple-600 font-bold text-lg">{{ getInitials(student.student?.fullName || 'N/A') }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-gray-900 truncate">{{ student.student?.fullName || 'N/A' }}</h3>
                    <p class="text-xs text-gray-500">
                      {{ student.changed ? '🔄 Modified' : (student.status ? '✓ Recorded' : 'Not marked') }}
                    </p>
                  </div>
                </div>

                <!-- Original Status (if changed) -->
                <div *ngIf="student.changed && student.originalStatus" class="mb-2 p-2 bg-gray-100 rounded text-xs">
                  <span class="text-gray-600">Was:</span>
                  <span class="font-medium ml-1" 
                        [ngClass]="{
                          'text-green-700': student.originalStatus === 'present',
                          'text-red-700': student.originalStatus === 'absent',
                          'text-yellow-700': student.originalStatus === 'late',
                          'text-blue-700': student.originalStatus === 'excused'
                        }">
                    {{ student.originalStatus | titlecase }}
                  </span>
                </div>

                <!-- Status Buttons -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <button 
                    (click)="setStatus(i, 'present')"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    [ngClass]="{
                      'bg-green-500 text-white shadow-lg': student.status === 'present',
                      'bg-green-50 text-green-700 hover:bg-green-100': student.status !== 'present'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Present
                  </button>
                  <button 
                    (click)="setStatus(i, 'absent')"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    [ngClass]="{
                      'bg-red-500 text-white shadow-lg': student.status === 'absent',
                      'bg-red-50 text-red-700 hover:bg-red-100': student.status !== 'absent'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Absent
                  </button>
                  <button 
                    (click)="setStatus(i, 'late')"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    [ngClass]="{
                      'bg-yellow-500 text-white shadow-lg': student.status === 'late',
                      'bg-yellow-50 text-yellow-700 hover:bg-yellow-100': student.status !== 'late'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Late
                  </button>
                  <button 
                    (click)="setStatus(i, 'excused')"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    [ngClass]="{
                      'bg-blue-500 text-white shadow-lg': student.status === 'excused',
                      'bg-blue-50 text-blue-700 hover:bg-blue-100': student.status !== 'excused'
                    }"
                    class="px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    (ngModelChange)="trackChange(i)"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                    [(ngModel)]="student.notes"
                    (ngModelChange)="trackChange(i)"
                    [disabled]="!!(attendance.isLocked && !isAdmin)"
                    rows="2"
                    placeholder="Add notes..."
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Session Notes -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Session Notes</h2>
            <textarea 
              [(ngModel)]="sessionNotes"
              (ngModelChange)="trackNotesChange()"
              [disabled]="!!(attendance.isLocked && !isAdmin)"
              rows="4"
              placeholder="Add any notes about this session..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50"
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
                *ngIf="attendance.isLocked && isAdmin"
                (click)="unlockSession()"
                class="px-6 py-3 bg-yellow-100 text-yellow-700 font-medium rounded-lg hover:bg-yellow-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                </svg>
                Unlock First
              </button>
              <button 
                *ngIf="!attendance.isLocked || isAdmin"
                (click)="saveChanges()"
                [disabled]="isSaving || !hasChanges"
                class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg *ngIf="!isSaving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <svg *ngIf="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSaving ? 'Saving...' : 'Save Changes (' + changeCount + ')' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceEditComponent implements OnInit {
  attendanceId: string | null = null;
  attendance: Attendance | null = null;
  students: any[] = [];
  originalStudents: any[] = [];
  sessionNotes: string = '';
  originalSessionNotes: string = '';
  isLoading = false;
  isSaving = false;
  error: string = '';
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.attendanceId = this.route.snapshot.paramMap.get('id');
    
    // Check if user is admin
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.isAdmin = currentUser.role === 'admin';
    }

    if (this.attendanceId) {
      this.loadAttendance(this.attendanceId);
    } else {
      this.error = 'No attendance ID provided';
      this.toastService.error(this.error);
    }
  }

  loadAttendance(id: string) {
    this.isLoading = true;
    this.error = '';

    this.attendanceService.getAttendance(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendance = response.data.attendance;
          this.initializeStudents();
          this.sessionNotes = this.attendance.sessionNotes || '';
          this.originalSessionNotes = this.sessionNotes;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.error = error.error?.message || 'Failed to load attendance details';
        this.isLoading = false;
        this.toastService.error(this.error);
      }
    });
  }

  initializeStudents() {
    if (!this.attendance || !this.attendance.records) {
      this.students = [];
      this.originalStudents = [];
      return;
    }

    this.students = this.attendance.records.map((record: any) => ({
      student: record.student,
      status: record.status,
      minutesLate: record.minutesLate || 0,
      notes: record.notes || '',
      changed: false,
      originalStatus: record.status,
      originalMinutesLate: record.minutesLate || 0,
      originalNotes: record.notes || ''
    }));

    // Deep copy for reset functionality
    this.originalStudents = JSON.parse(JSON.stringify(this.students));
  }

  setStatus(index: number, status: string) {
    if (this.students[index]) {
      this.students[index].status = status;
      if (status !== 'late') {
        this.students[index].minutesLate = 0;
      }
      this.trackChange(index);
    }
  }

  trackChange(index: number) {
    if (!this.students[index]) return;

    const student = this.students[index];
    const original = this.originalStudents[index];

    student.changed = (
      student.status !== original.status ||
      student.minutesLate !== original.minutesLate ||
      student.notes !== original.notes
    );
  }

  trackNotesChange() {
    // Session notes change tracking is implicit
  }

  markAllPresent() {
    this.students.forEach((student, index) => {
      student.status = 'present';
      student.minutesLate = 0;
      this.trackChange(index);
    });
    this.toastService.success('All students marked as present');
  }

  markAllAbsent() {
    this.students.forEach((student, index) => {
      student.status = 'absent';
      student.minutesLate = 0;
      this.trackChange(index);
    });
    this.toastService.success('All students marked as absent');
  }

  resetChanges() {
    this.confirmationService.confirm({
      title: 'Reset All Changes?',
      message: 'This will discard all your changes and restore the original attendance data.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      type: 'warning'
    }).then((confirmed) => {
      if (confirmed) {
        this.students = JSON.parse(JSON.stringify(this.originalStudents));
        this.sessionNotes = this.originalSessionNotes;
        this.toastService.info('All changes have been reset');
      }
    });
  }

  unlockSession() {
    if (!this.attendance?._id) return;

    this.confirmationService.confirm({
      title: 'Unlock Attendance Session?',
      message: 'This will allow editing of the attendance record.',
      confirmText: 'Unlock',
      cancelText: 'Cancel',
      type: 'warning'
    }).then((confirmed) => {
      if (confirmed) {
        this.attendanceService.unlockAttendance(this.attendance!._id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('Attendance session unlocked successfully');
              this.loadAttendance(this.attendance!._id!);
            }
          },
          error: (error) => {
            console.error('Error unlocking attendance:', error);
            this.toastService.error('Failed to unlock attendance session');
          }
        });
      }
    });
  }

  saveChanges() {
    if (!this.attendance || !this.hasChanges) return;

    if (this.attendance.isLocked && !this.isAdmin) {
      this.toastService.error('Cannot edit locked attendance session');
      return;
    }

    this.confirmationService.confirm({
      title: 'Save Changes?',
      message: `You have ${this.changeCount} change(s). Do you want to save them?`,
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    }).then((confirmed) => {
      if (confirmed) {
        this.performSave();
      }
    });
  }

  performSave() {
    this.isSaving = true;

    const updatedRecords = this.students.map(s => ({
      studentId: s.student._id || s.student,
      status: s.status,
      minutesLate: s.status === 'late' ? (s.minutesLate || 0) : 0,
      notes: s.notes || ''
    }));

    const data = {
      records: updatedRecords,
      sessionNotes: this.sessionNotes,
      isCompleted: true
    };

    this.attendanceService.updateAttendance(this.attendance!._id!, data).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.toastService.success('Attendance updated successfully');
          this.router.navigate(['/attendance', this.attendance!._id]);
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating attendance:', error);
        this.toastService.error(error.error?.message || 'Failed to update attendance');
      }
    });
  }

  get hasChanges(): boolean {
    const studentChanges = this.students.some(s => s.changed);
    const notesChanged = this.sessionNotes !== this.originalSessionNotes;
    return studentChanges || notesChanged;
  }

  get changeCount(): number {
    let count = 0;
    count += this.students.filter(s => s.changed).length;
    if (this.sessionNotes !== this.originalSessionNotes) count++;
    return count;
  }

  getStatusCount(status: string): number {
    return this.students.filter(s => s.status === status).length;
  }

  get attendanceRate(): number {
    if (this.students.length === 0) return 0;
    
    const present = this.getStatusCount('present');
    const late = this.getStatusCount('late');
    return Math.round(((present + late) / this.students.length) * 100);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  goBack() {
    if (this.hasChanges) {
      this.confirmationService.confirm({
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'Discard',
        cancelText: 'Stay',
        type: 'warning'
      }).then((confirmed) => {
        if (confirmed) {
          if (this.attendance?._id) {
            this.router.navigate(['/attendance', this.attendance._id]);
          } else {
            this.router.navigate(['/attendance']);
          }
        }
      });
    } else {
      if (this.attendance?._id) {
        this.router.navigate(['/attendance', this.attendance._id]);
      } else {
        this.router.navigate(['/attendance']);
      }
    }
  }
}
