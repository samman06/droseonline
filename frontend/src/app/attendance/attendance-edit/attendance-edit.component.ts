import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

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
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Edit Attendance</h1>
              <p class="text-gray-600" *ngIf="attendance">{{ attendance.group?.name }} - {{ attendance.session.date | date:'fullDate' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Lock/Unlock Indicator -->
              <div *ngIf="attendance" class="flex items-center gap-2">
                <span 
                  *ngIf="attendance.isLocked"
                  class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-red-100 text-red-800"
                >
                  <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                  </svg>
                  Locked
                </span>
                <button 
                  *ngIf="attendance.isLocked && isAdmin"
                  (click)="unlockSession()"
                  class="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                  title="Admin: Unlock this session"
                >
                  🔓 Unlock
                </button>
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
          <!-- Locked Warning -->
          <div *ngIf="attendance && attendance.isLocked && !isAdmin" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              ⚠️ This session is locked. Only administrators can make changes.
            </p>
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
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <p class="text-indigo-100 text-sm">Attendance Rate</p>
                <p class="font-semibold">{{ attendance.stats?.rate || 0 }}%</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap gap-3">
                <button 
                  (click)="markAllAs('present')"
                  [disabled]="!canEdit"
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ✓ Mark All Present
                </button>
                <button 
                  (click)="markAllAs('absent')"
                  [disabled]="!canEdit"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ✗ Mark All Absent
                </button>
                <button 
                  (click)="invertSelection()"
                  [disabled]="!canEdit"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ⇄ Invert
                </button>
              </div>
              <div class="flex items-center gap-2">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="enableKeyboardShortcuts"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">Keyboard Shortcuts</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Students List -->
          <div class="p-6">
            <div class="space-y-3">
              <div *ngFor="let record of attendance.records; let i = index" 
                   [attr.data-index]="i"
                   (keydown)="handleKeyPress($event, i)"
                   class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus-within:ring-2 focus-within:ring-indigo-500">
                <div class="flex items-start gap-4">
                  <!-- Student Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate">{{ i + 1 }}. {{ record.student?.fullName }}</p>
                    <p class="text-sm text-gray-500">{{ record.student?.academicInfo?.studentId || 'N/A' }}</p>
                  </div>

                  <!-- Status Buttons -->
                  <div class="flex items-center gap-2">
                    <button 
                      (click)="setStatus(i, 'present')"
                      [disabled]="!canEdit"
                      [class]="record.status === 'present' 
                        ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Present
                    </button>
                    <button 
                      (click)="setStatus(i, 'late')"
                      [disabled]="!canEdit"
                      [class]="record.status === 'late' 
                        ? 'bg-yellow-600 text-white ring-2 ring-yellow-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ⏰ Late
                    </button>
                    <button 
                      (click)="setStatus(i, 'absent')"
                      [disabled]="!canEdit"
                      [class]="record.status === 'absent' 
                        ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Absent
                    </button>
                    <button 
                      (click)="setStatus(i, 'excused')"
                      [disabled]="!canEdit"
                      [class]="record.status === 'excused' 
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      📋 Excused
                    </button>
                  </div>
                </div>

                <!-- Late Minutes Input -->
                <div *ngIf="record.status === 'late'" class="mt-3 flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Minutes Late:</label>
                  <input 
                    type="number" 
                    [(ngModel)]="record.minutesLate"
                    [disabled]="!canEdit"
                    min="0"
                    max="240"
                    placeholder="0"
                    class="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span class="text-xs text-gray-500">minutes</span>
                </div>

                <!-- Notes Input -->
                <div class="mt-3">
                  <input 
                    type="text" 
                    [(ngModel)]="record.notes"
                    [disabled]="!canEdit"
                    placeholder="Add notes (optional)..."
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <!-- Marked By Info -->
                <div *ngIf="record.markedBy || record.markedAt" class="mt-2 text-xs text-gray-500">
                  Last updated: {{ record.markedAt | date:'short' }}
                </div>
              </div>
            </div>

            <!-- Session Notes -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Notes (Optional)</label>
              <textarea 
                [(ngModel)]="attendance.sessionNotes"
                [disabled]="!canEdit"
                rows="3"
                placeholder="Add any notes about this session..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              ></textarea>
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
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <label *ngIf="!attendance.isLocked && canEdit" class="flex items-center">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="lockAfterSave"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">Lock session after saving</span>
                </label>
              </div>
              <div class="flex gap-3">
                <button 
                  (click)="goBack()"
                  class="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  (click)="saveChanges()"
                  [disabled]="isSaving || !canEdit"
                  class="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg *ngIf="!isSaving" class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span *ngIf="isSaving" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceEditComponent implements OnInit, OnDestroy {
  attendanceId: string = '';
  attendance: any = null;
  
  isLoading = false;
  isSaving = false;
  error: string = '';
  
  // New features
  enableKeyboardShortcuts: boolean = true;
  lockAfterSave: boolean = false;
  currentFocusIndex: number = 0;
  isAdmin: boolean = false;
  canEdit: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {}
  
  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => this.handleGlobalKeyPress(e));
    }
  }
  
  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', (e) => this.handleGlobalKeyPress(e));
    }
  }

  ngOnInit(): void {
    this.attendanceId = this.route.snapshot.paramMap.get('id') || '';
    const currentUser = this.authService.currentUser;
    this.isAdmin = currentUser?.role === 'admin';
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.error = '';

    this.attendanceService.getAttendance(this.attendanceId).subscribe({
      next: (response) => {
        this.attendance = response;
        this.canEdit = !this.attendance.isLocked || this.isAdmin;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load attendance';
        this.isLoading = false;
      }
    });
  }

  setStatus(index: number, status: string): void {
    if (!this.canEdit) return;
    this.attendance.records[index].status = status;
    if (status === 'late') {
      this.attendance.records[index].minutesLate = this.attendance.records[index].minutesLate || 5;
    }
  }

  markAllAs(status: string): void {
    if (!this.canEdit) return;
    this.attendance.records.forEach((record: any) => {
      record.status = status;
      if (status === 'late' && !record.minutesLate) {
        record.minutesLate = 5;
      }
    });
  }

  invertSelection(): void {
    if (!this.canEdit) return;
    this.attendance.records.forEach((record: any) => {
      if (record.status === 'present') {
        record.status = 'absent';
      } else if (record.status === 'absent') {
        record.status = 'present';
      }
    });
  }
  
  handleGlobalKeyPress(e: KeyboardEvent): void {
    if (!this.enableKeyboardShortcuts || !this.attendance || !this.canEdit) return;
    
    if (e.ctrlKey || e.metaKey) {
      if (e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.markAllAs('present');
      } else if (e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.markAllAs('absent');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        this.invertSelection();
      }
    }
  }
  
  handleKeyPress(e: KeyboardEvent, index: number): void {
    if (!this.enableKeyboardShortcuts || !this.canEdit) return;
    
    const key = e.key.toLowerCase();
    
    if (key === 'p') {
      e.preventDefault();
      this.setStatus(index, 'present');
    } else if (key === 'l') {
      e.preventDefault();
      this.setStatus(index, 'late');
    } else if (key === 'a') {
      e.preventDefault();
      this.setStatus(index, 'absent');
    } else if (key === 'e') {
      e.preventDefault();
      this.setStatus(index, 'excused');
    }
  }

  getSummary() {
    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    if (!this.attendance || !this.attendance.records) return summary;

    this.attendance.records.forEach((record: any) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'excused') summary.excused++;
    });

    return summary;
  }

  async unlockSession(): Promise<void> {
    if (!this.isAdmin) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Unlock Session',
      message: 'Are you sure you want to unlock this session? This will allow edits again.',
      confirmText: 'Unlock',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    this.attendanceService.unlockAttendance(this.attendanceId).subscribe({
      next: () => {
        this.loadAttendance();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to unlock session';
      }
    });
  }

  async saveChanges(): Promise<void> {
    if (!this.canEdit) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Save Changes',
      message: this.lockAfterSave
        ? 'Save and lock this session? You will not be able to edit it later (unless you are an admin).'
        : 'Are you sure you want to save these changes?',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;

    const updates = {
      records: this.attendance.records.map((r: any) => ({
        studentId: r.student._id || r.student,
        status: r.status,
        minutesLate: r.minutesLate || 0,
        notes: r.notes || ''
      })),
      sessionNotes: this.attendance.sessionNotes,
      isCompleted: true
    };

    this.attendanceService.updateAttendance(this.attendanceId, updates).subscribe({
      next: (response) => {
        // Lock if requested
        if (this.lockAfterSave && !this.attendance.isLocked) {
          this.attendanceService.lockAttendance(this.attendanceId).subscribe({
            next: () => {
              this.router.navigate(['/dashboard/attendance']);
            },
            error: (err) => {
              console.error('Failed to lock session:', err);
              this.router.navigate(['/dashboard/attendance']);
            }
          });
        } else {
          this.router.navigate(['/dashboard/attendance']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save changes';
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/attendance']);
  }
}