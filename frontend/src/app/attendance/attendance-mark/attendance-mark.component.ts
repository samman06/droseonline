import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { GroupService } from '../../services/group.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-attendance-mark',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-indigo-600">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
              <p class="text-gray-600" *ngIf="group">{{ group.name }} - {{ group.subject?.name }}</p>
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

        <!-- Group Selection -->
        <div *ngIf="!groupId" class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Select a Group</h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select 
                [(ngModel)]="selectedGroupId"
                (change)="onGroupSelect()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">-- Select a Group --</option>
                <option *ngFor="let g of allGroups" [value]="g._id">
                  {{ g.name }} - {{ g.subject?.name }} ({{ g.teacher?.fullName }})
                </option>
              </select>
            </div>
            <div *ngIf="selectedGroup" class="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Teacher</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.teacher?.fullName }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Grade Level</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.gradeLevel }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Students</p>
                  <p class="font-semibold text-gray-900">{{ selectedGroup.students?.length || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p class="mt-4 text-gray-600">Loading group details...</p>
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

        <!-- Attendance Form -->
        <div *ngIf="!isLoading && !error && group" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Session Info -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-indigo-100 text-sm">Teacher</p>
                <p class="font-semibold">{{ group.teacher?.fullName }}</p>
              </div>
              <div>
                <p class="text-indigo-100 text-sm">Session Date</p>
                <p class="font-semibold">{{ sessionDate | date:'fullDate' }}</p>
              </div>
              <div>
                <p class="text-indigo-100 text-sm">Total Students</p>
                <p class="font-semibold">{{ students.length }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap gap-3">
                <button 
                  (click)="markAllAs('present')"
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                  title="Keyboard: Ctrl+Shift+P"
                >
                  ✓ Mark All Present
                </button>
                <button 
                  (click)="markAllAs('absent')"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  title="Keyboard: Ctrl+Shift+A"
                >
                  ✗ Mark All Absent
                </button>
                <button 
                  (click)="invertSelection()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  title="Keyboard: Ctrl+I"
                >
                  ⇄ Invert
                </button>
                <button 
                  (click)="resetAll()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  title="Keyboard: Ctrl+R"
                >
                  ↻ Reset
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
            <div class="mt-2 text-xs text-gray-500">
              <span class="font-medium">Quick Keys:</span> P=Present, L=Late, A=Absent, E=Excused | 
              <span class="font-medium">Navigate:</span> ↑↓ or Tab
            </div>
          </div>

          <!-- Students List -->
          <div class="p-6">
            <div class="space-y-3">
              <div *ngFor="let student of students; let i = index" 
                   [attr.data-index]="i"
                   (keydown)="handleKeyPress($event, i)"
                   class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus-within:ring-2 focus-within:ring-indigo-500">
                <div class="flex items-start gap-4">
                  <!-- Student Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate">{{ i + 1 }}. {{ student.fullName }}</p>
                    <p class="text-sm text-gray-500">{{ student.academicInfo?.studentId || 'N/A' }}</p>
                  </div>

                  <!-- Status Buttons -->
                  <div class="flex items-center gap-2">
                    <button 
                      (click)="setStatus(i, 'present')"
                      [class]="attendanceRecords[i].status === 'present' 
                        ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200"
                      title="P"
                    >
                      ✓ Present
                    </button>
                    <button 
                      (click)="setStatus(i, 'late')"
                      [class]="attendanceRecords[i].status === 'late' 
                        ? 'bg-yellow-600 text-white ring-2 ring-yellow-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200"
                      title="L"
                    >
                      ⏰ Late
                    </button>
                    <button 
                      (click)="setStatus(i, 'absent')"
                      [class]="attendanceRecords[i].status === 'absent' 
                        ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200"
                      title="A"
                    >
                      ✗ Absent
                    </button>
                    <button 
                      (click)="setStatus(i, 'excused')"
                      [class]="attendanceRecords[i].status === 'excused' 
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-200"
                      title="E"
                    >
                      📋 Excused
                    </button>
                  </div>
                </div>

                <!-- Late Minutes Input (shown when status is late) -->
                <div *ngIf="attendanceRecords[i].status === 'late'" class="mt-3 flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Minutes Late:</label>
                  <input 
                    type="number" 
                    [(ngModel)]="attendanceRecords[i].minutesLate"
                    min="0"
                    max="240"
                    placeholder="0"
                    class="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <span class="text-xs text-gray-500">minutes</span>
                </div>

                <!-- Notes Input -->
                <div class="mt-3">
                  <input 
                    type="text" 
                    [(ngModel)]="attendanceRecords[i].notes"
                    placeholder="Add notes (optional)..."
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Session Notes -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Notes (Optional)</label>
              <textarea 
                [(ngModel)]="sessionNotes"
                rows="3"
                placeholder="Add any notes about this session..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="lockAfterSave"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">Lock session after saving</span>
                </label>
                <button 
                  type="button"
                  class="text-sm text-gray-500 hover:text-gray-700"
                  title="Locking prevents further edits (admins can unlock)"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
              <div class="flex gap-3">
                <button 
                  (click)="goBack()"
                  class="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  (click)="saveAttendance()"
                  [disabled]="isSaving"
                  class="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg *ngIf="!isSaving" class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span *ngIf="isSaving" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {{ isSaving ? 'Saving...' : 'Save Attendance' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceMarkComponent implements OnInit {
  groupId: string = '';
  selectedGroupId: string = '';
  selectedGroup: any = null;
  allGroups: any[] = [];
  group: any = null;
  students: any[] = [];
  attendanceRecords: any[] = [];
  sessionDate: Date = new Date();
  sessionNotes: string = '';
  scheduleIndex: number = 0;
  
  isLoading = false;
  isSaving = false;
  error: string = '';
  
  // New features
  enableKeyboardShortcuts: boolean = true;
  lockAfterSave: boolean = false;
  currentFocusIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private groupService: GroupService,
    private confirmationService: ConfirmationService
  ) {}
  
  // Keyboard shortcuts listener
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
    this.groupId = this.route.snapshot.paramMap.get('groupId') || '';
    if (this.groupId) {
      this.loadGroup();
    } else {
      this.loadAllGroups();
    }
  }

  loadAllGroups(): void {
    this.isLoading = true;
    this.groupService.getGroups({ page: 1, limit: 10, isActive: 'true' }).subscribe({
      next: (response: any) => {
        console.log('Groups API Response:', response);
        // Handle the nested structure: response.data.groups
        if (response && response.data) {
          this.allGroups = response.data.groups || response.data || [];
        } else {
          this.allGroups = [];
        }
        console.log('All Groups:', this.allGroups);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.error = 'Failed to load groups';
        this.isLoading = false;
      }
    });
  }

  onGroupSelect(): void {
    if (this.selectedGroupId) {
      this.selectedGroup = this.allGroups.find(g => g._id === this.selectedGroupId);
      this.groupId = this.selectedGroupId;
      this.loadGroup();
    } else {
      this.selectedGroup = null;
      this.group = null;
      this.students = [];
      this.attendanceRecords = [];
    }
  }

  loadGroup(): void {
    this.isLoading = true;
    this.error = '';

    this.groupService.getGroup(this.groupId).subscribe({
      next: (response: any) => {
        console.log('Group Detail API Response:', response);
        // Handle API response structure: { success, data: group }
        this.group = response.data || response;
        
        // Extract students from the nested structure
        const studentsArray = this.group.students || [];
        // Map to get the actual student objects (they're nested as student.student)
        this.students = studentsArray.map((s: any) => s.student || s);
        
        console.log('Students:', this.students);
        
        // Initialize attendance records with default status 'present'
        this.attendanceRecords = this.students.map((student: any) => ({
          studentId: student._id,
          status: 'present',
          notes: ''
        }));

        // Determine schedule index based on today's day
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][this.sessionDate.getDay()];
        this.scheduleIndex = this.group.schedule?.findIndex((s: any) => s.day.toLowerCase() === dayOfWeek) || 0;
        
        if (this.scheduleIndex === -1) {
          this.scheduleIndex = 0;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load group:', err);
        this.error = err.error?.message || 'Failed to load group details';
        this.isLoading = false;
      }
    });
  }

  setStatus(index: number, status: string): void {
    this.attendanceRecords[index].status = status;
    // Auto-focus on minutes late if setting to late
    if (status === 'late') {
      this.attendanceRecords[index].minutesLate = this.attendanceRecords[index].minutesLate || 5;
    }
  }

  markAllAs(status: string): void {
    this.attendanceRecords.forEach(record => {
      record.status = status;
      if (status === 'late' && !record.minutesLate) {
        record.minutesLate = 5;
      }
    });
  }

  invertSelection(): void {
    this.attendanceRecords.forEach(record => {
      if (record.status === 'present') {
        record.status = 'absent';
      } else if (record.status === 'absent') {
        record.status = 'present';
      }
    });
  }

  resetAll(): void {
    this.attendanceRecords.forEach(record => {
      record.status = 'present';
      record.notes = '';
      record.minutesLate = 0;
    });
    this.sessionNotes = '';
  }
  
  // Keyboard shortcuts handlers
  handleGlobalKeyPress(e: KeyboardEvent): void {
    if (!this.enableKeyboardShortcuts || !this.group) return;
    
    // Bulk actions with Ctrl/Cmd
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
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.resetAll();
      }
    }
  }
  
  handleKeyPress(e: KeyboardEvent, index: number): void {
    if (!this.enableKeyboardShortcuts) return;
    
    const key = e.key.toLowerCase();
    
    // Status shortcuts
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
    // Navigation
    else if (key === 'arrowup' && index > 0) {
      e.preventDefault();
      this.currentFocusIndex = index - 1;
      this.focusOnRow(this.currentFocusIndex);
    } else if (key === 'arrowdown' && index < this.students.length - 1) {
      e.preventDefault();
      this.currentFocusIndex = index + 1;
      this.focusOnRow(this.currentFocusIndex);
    }
  }
  
  focusOnRow(index: number): void {
    if (typeof document !== 'undefined') {
      const row = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
      if (row) {
        row.focus();
      }
    }
  }

  getSummary() {
    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    this.attendanceRecords.forEach(record => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'excused') summary.excused++;
    });

    return summary;
  }

  async saveAttendance(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Save Attendance',
      message: this.lockAfterSave 
        ? 'Save and lock this session? You will not be able to edit it later (unless you are an admin).' 
        : 'Are you sure you want to save this attendance record?',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;

    const data = {
      groupId: this.groupId,
      sessionDate: this.sessionDate,
      scheduleIndex: this.scheduleIndex,
      records: this.attendanceRecords,
      sessionNotes: this.sessionNotes,
      isCompleted: true
    };

    this.attendanceService.createAttendance(data).subscribe({
      next: (response) => {
        // Lock session if requested
        if (this.lockAfterSave && response.attendance && response.attendance._id) {
          this.attendanceService.lockAttendance(response.attendance._id).subscribe({
            next: () => {
              this.router.navigate(['/dashboard/attendance']);
            },
            error: (err) => {
              console.error('Failed to lock session:', err);
              // Still navigate even if locking fails
              this.router.navigate(['/dashboard/attendance']);
            }
          });
        } else {
          this.router.navigate(['/dashboard/attendance']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save attendance';
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/attendance']);
  }
}
