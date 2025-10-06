import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-attendance-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-indigo-600">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Edit Attendance</h1>
              <p class="text-gray-600" *ngIf="attendance">{{ attendance.group?.name }} - {{ attendance.session.date | date:'fullDate' }}</p>
            </div>
            <button 
              (click)="goBack()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p class="mt-4 text-gray-600">Loading attendance...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ error }}</p>
          </div>
        </div>

        <!-- Edit Form -->
        <div *ngIf="!isLoading && !error && attendance" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Session Info -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-indigo-100 text-sm">Teacher</p>
                <p class="font-semibold">{{ attendance.teacher?.fullName }}</p>
              </div>
              <div>
                <p class="text-indigo-100 text-sm">Session Date</p>
                <p class="font-semibold">{{ attendance.session.date | date:'fullDate' }}</p>
              </div>
              <div>
                <p class="text-indigo-100 text-sm">Total Students</p>
                <p class="font-semibold">{{ attendance.records.length }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex flex-wrap gap-3">
              <button 
                (click)="markAllAs('present')"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                ✓ Mark All Present
              </button>
              <button 
                (click)="markAllAs('absent')"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                ✗ Mark All Absent
              </button>
            </div>
          </div>

          <!-- Students List -->
          <div class="p-6">
            <div class="space-y-4">
              <div *ngFor="let record of attendance.records; let i = index" 
                   class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ record.student?.fullName }}</p>
                  <p class="text-sm text-gray-500">Grade: {{ record.student?.gradeLevel }}</p>
                </div>

                <!-- Status Buttons -->
                <div class="flex items-center gap-2">
                  <button 
                    (click)="setStatus(i, 'present')"
                    [class]="attendance.records[i].status === 'present' 
                      ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50'"
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                  >
                    Present
                  </button>
                  <button 
                    (click)="setStatus(i, 'late')"
                    [class]="attendance.records[i].status === 'late' 
                      ? 'bg-yellow-600 text-white ring-2 ring-yellow-600 ring-offset-2' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50'"
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                  >
                    Late
                  </button>
                  <button 
                    (click)="setStatus(i, 'absent')"
                    [class]="attendance.records[i].status === 'absent' 
                      ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50'"
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  >
                    Absent
                  </button>
                  <button 
                    (click)="setStatus(i, 'excused')"
                    [class]="attendance.records[i].status === 'excused' 
                      ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50'"
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Excused
                  </button>
                </div>

                <!-- Notes Input -->
                <div class="ml-4 w-48">
                  <input 
                    type="text" 
                    [(ngModel)]="attendance.records[i].notes"
                    placeholder="Add notes..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Session Notes -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Notes (Optional)</label>
              <textarea 
                [(ngModel)]="attendance.sessionNotes"
                rows="3"
                placeholder="Add any notes about this session..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              ></textarea>
            </div>

            <!-- Completion Status -->
            <div class="mt-6">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="attendance.isCompleted"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="ml-2 text-sm font-medium text-gray-700">Mark as completed</span>
              </label>
            </div>

            <!-- Summary -->
            <div class="mt-6 p-4 bg-indigo-50 rounded-lg">
              <h3 class="text-sm font-semibold text-indigo-900 mb-2">Summary</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p class="text-2xl font-bold text-green-600">{{ getSummary().present }}</p>
                  <p class="text-xs text-gray-600">Present</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-yellow-600">{{ getSummary().late }}</p>
                  <p class="text-xs text-gray-600">Late</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-red-600">{{ getSummary().absent }}</p>
                  <p class="text-xs text-gray-600">Absent</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-blue-600">{{ getSummary().excused }}</p>
                  <p class="text-xs text-gray-600">Excused</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button 
              (click)="goBack()"
              class="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              (click)="saveChanges()"
              [disabled]="isSaving"
              class="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceEditComponent implements OnInit {
  attendanceId: string = '';
  attendance: any = null;
  isLoading = false;
  isSaving = false;
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
        this.error = err.error?.message || 'Failed to load attendance';
        this.isLoading = false;
      }
    });
  }

  setStatus(index: number, status: string): void {
    this.attendance.records[index].status = status;
  }

  markAllAs(status: string): void {
    this.attendance.records.forEach((record: any) => {
      record.status = status;
    });
  }

  getSummary() {
    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    this.attendance.records.forEach((record: any) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'excused') summary.excused++;
    });

    return summary;
  }

  async saveChanges(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Save Changes',
      message: 'Are you sure you want to save these changes?',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;

    const data = {
      records: this.attendance.records.map((record: any) => ({
        studentId: record.student._id,
        status: record.status,
        notes: record.notes || ''
      })),
      sessionNotes: this.attendance.sessionNotes,
      isCompleted: this.attendance.isCompleted
    };

    this.attendanceService.updateAttendance(this.attendanceId, data).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/attendance', this.attendanceId]);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update attendance';
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/attendance', this.attendanceId]);
  }
}
