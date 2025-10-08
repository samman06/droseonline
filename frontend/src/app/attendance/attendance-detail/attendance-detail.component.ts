import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">Back to Attendance</span>
        </button>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Attendance Details</h1>
            <p class="text-gray-600" *ngIf="attendance">{{ attendance.group?.name }} - {{ attendance.session.date | date:'fullDate' }}</p>
          </div>
          <div class="flex gap-3">
            <button 
              (click)="editAttendance()"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
            <button 
              (click)="deleteAttendance()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-600">Loading attendance details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <p class="text-red-800 font-medium">{{ error }}</p>
        </div>
      </div>

      <!-- Attendance Details -->
      <div *ngIf="!isLoading && !error && attendance" class="space-y-6">
          <!-- Session Info Card -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 class="text-xl font-bold mb-4">Session Information</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-indigo-100 text-sm">Group</p>
                  <p class="font-semibold">{{ attendance.group?.name }}</p>
                </div>
                <div>
                  <p class="text-indigo-100 text-sm">Teacher</p>
                  <p class="font-semibold">{{ attendance.teacher?.fullName }}</p>
                </div>
                <div>
                  <p class="text-indigo-100 text-sm">Subject</p>
                  <p class="font-semibold">{{ attendance.subject?.name }}</p>
                </div>
                <div>
                  <p class="text-indigo-100 text-sm">Date</p>
                  <p class="font-semibold">{{ attendance.session.date | date:'fullDate' }}</p>
                </div>
                <div>
                  <p class="text-indigo-100 text-sm">Status</p>
                  <span 
                    class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full"
                    [class]="attendance.isCompleted ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'"
                  >
                    {{ attendance.isCompleted ? 'Completed' : 'Incomplete' }}
                  </span>
                </div>
                <div>
                  <p class="text-indigo-100 text-sm">Attendance Rate</p>
                  <p class="font-semibold">{{ attendance.stats?.rate || 0 }}%</p>
                </div>
              </div>
            </div>

            <!-- Session Notes -->
            <div *ngIf="attendance.sessionNotes" class="p-6 bg-yellow-50 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900 mb-2">Session Notes</h3>
              <p class="text-gray-700">{{ attendance.sessionNotes }}</p>
            </div>

            <!-- Statistics -->
            <div class="p-6 bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-900 mb-4">Summary</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-white rounded-lg shadow">
                  <p class="text-3xl font-bold text-green-600">{{ attendance.stats?.present || 0 }}</p>
                  <p class="text-xs text-gray-600 mt-1">Present</p>
                </div>
                <div class="text-center p-4 bg-white rounded-lg shadow">
                  <p class="text-3xl font-bold text-yellow-600">{{ attendance.stats?.late || 0 }}</p>
                  <p class="text-xs text-gray-600 mt-1">Late</p>
                </div>
                <div class="text-center p-4 bg-white rounded-lg shadow">
                  <p class="text-3xl font-bold text-red-600">{{ attendance.stats?.absent || 0 }}</p>
                  <p class="text-xs text-gray-600 mt-1">Absent</p>
                </div>
                <div class="text-center p-4 bg-white rounded-lg shadow">
                  <p class="text-3xl font-bold text-blue-600">{{ attendance.stats?.excused || 0 }}</p>
                  <p class="text-xs text-gray-600 mt-1">Excused</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Student Records -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-bold text-gray-900">Student Records</h2>
            </div>
            <div class="p-6">
              <div class="space-y-3">
                <div *ngFor="let record of attendance.records" 
                     class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900">{{ record.student?.fullName }}</p>
                    <p class="text-sm text-gray-500" *ngIf="record.notes">{{ record.notes }}</p>
                  </div>
                  <div class="flex items-center gap-4">
                    <span 
                      class="inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg"
                      [ngClass]="{
                        'bg-green-100 text-green-800': record.status === 'present',
                        'bg-yellow-100 text-yellow-800': record.status === 'late',
                        'bg-red-100 text-red-800': record.status === 'absent',
                        'bg-blue-100 text-blue-800': record.status === 'excused'
                      }"
                    >
                      {{ record.status | titlecase }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  `
})
export class AttendanceDetailComponent implements OnInit {
  attendanceId: string = '';
  attendance: any = null;
  isLoading = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.attendanceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.attendanceId) {
      this.loadAttendance();
    } else {
      this.error = 'Attendance ID is required';
    }
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.error = '';

    this.attendanceService.getAttendance(this.attendanceId).subscribe({
      next: (attendance) => {
        this.attendance = attendance;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load attendance details';
        this.isLoading = false;
      }
    });
  }

  editAttendance(): void {
    this.router.navigate(['/dashboard/attendance/edit', this.attendanceId]);
  }

  async deleteAttendance(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Attendance Record',
      message: 'Are you sure you want to delete this attendance record? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    this.attendanceService.deleteAttendance(this.attendanceId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/attendance']);
      },
      error: (err) => {
        console.error('Error deleting attendance:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/attendance']);
  }
}
