import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { GroupService } from '../../services/group.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h1 class="text-3xl font-bold">{{ title }}</h1>
        <p class="text-indigo-100">{{ subtitle }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Group Information</h2>
            <p class="mt-1 text-sm text-gray-600">Fill in the required details below</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="form.value.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
              <span class="w-2 h-2 rounded-full mr-2" [class]="form.value.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
              {{ form.value.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Name</label>
              <input class="form-input" formControlName="name" placeholder="e.g., Physics Group A" />
            </div>
            <div>
              <label class="form-label">Code</label>
              <input class="form-input" formControlName="code" placeholder="e.g., PHY-A-01" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Course <span class="text-red-500">*</span></label>
              <select class="form-input" formControlName="course">
                <option value="" disabled>Select a course</option>
                <option *ngFor="let c of courses" [value]="c._id">
                  {{ c.name }} - {{ c.code }}
                </option>
              </select>
              <p class="text-xs text-gray-500 mt-1">
                ℹ️ Teacher and subject are inherited from the course
              </p>
            </div>
            <div>
              <label class="form-label">Grade Level <span class="text-red-500">*</span></label>
              <select class="form-input" formControlName="gradeLevel">
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
              </select>
            </div>
          </div>

          <!-- Display course info when selected -->
          <div *ngIf="selectedCourse" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-900 mb-2">Course Information</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-blue-700 font-medium">Teacher:</span>
                <span class="text-blue-900 ml-2">{{ selectedCourse.teacher?.fullName }}</span>
              </div>
              <div>
                <span class="text-blue-700 font-medium">Subject:</span>
                <span class="text-blue-900 ml-2">{{ selectedCourse.subject?.name }}</span>
              </div>
            </div>
          </div>

          <div>
            <label class="form-label">Weekly Schedule</label>
            
            <!-- Schedule Conflict Warning -->
            <div *ngIf="scheduleConflicts.length > 0" class="mb-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-red-800 mb-1">⚠️ Schedule Conflict Detected</h4>
                  <p class="text-xs text-red-700 mb-2">The teacher has conflicting schedules with other groups:</p>
                  <ul class="space-y-1">
                    <li *ngFor="let conflict of scheduleConflicts" class="text-xs text-red-700">
                      <strong>{{ conflict.groupName }} ({{ conflict.groupCode }})</strong> - {{ conflict.day | titlecase }}: {{ conflict.time }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div *ngIf="checkingConflicts" class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <div class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking for schedule conflicts...
              </div>
            </div>
            
            <div formArrayName="schedule" class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3" *ngFor="let s of schedule.controls; let i = index" [formGroupName]="i">
                <select class="form-input" formControlName="day">
                  <option *ngFor="let d of days" [value]="d">{{ d | titlecase }}</option>
                </select>
                <input class="form-input" formControlName="startTime" placeholder="Start HH:MM" />
                <div class="flex items-center gap-2">
                  <input class="form-input" formControlName="endTime" placeholder="End HH:MM" />
                  <button type="button" (click)="removeSlot(i)" class="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Remove</button>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <button type="button" (click)="addSlot()" class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Add Slot
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="form-label">Price Per Session (EGP)</label>
              <input type="number" class="form-input" formControlName="pricePerSession" />
            </div>
            <div>
              <label class="form-label">Status</label>
              <select class="form-input" formControlName="isActive">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center px-8 py-6 bg-gray-50 border-t border-gray-200">
          <button type="button" (click)="goBack()" class="btn-secondary inline-flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back
          </button>
          <div class="space-x-3">
            <button type="button" (click)="cancel.emit()" class="btn-secondary">Cancel</button>
            <button type="submit" [disabled]="form.invalid || submitting" class="btn-primary">{{ submitText }}</button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-label { @apply block text-sm font-semibold text-gray-700 mb-2; }
    .form-input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200; }
    .btn-primary { @apply inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200; }
    .btn-secondary { @apply inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200; }
  `]
})
export class GroupFormComponent implements OnInit {
  @Input() initialValue: any = {};
  @Input() title = 'Add Group';
  @Input() subtitle = 'Create a weekly group with teacher, subject, and grade';
  @Input() submitText = 'Create Group';
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  submitting = false;

  readonly days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  readonly grades = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
  courses: any[] = [];
  selectedCourse: any = null;
  scheduleConflicts: any[] = [];
  checkingConflicts = false;

  constructor(
    private fb: FormBuilder, 
    private courseService: CourseService,
    private groupService: GroupService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Normalize initial IDs if objects were provided
    const initialCourseId = this.initialValue.course?._id || this.initialValue.course || '';

    this.form = this.fb.group({
      name: [this.initialValue.name || '', [Validators.required, Validators.minLength(2)]],
      code: [this.initialValue.code || '', [Validators.required]],
      course: [initialCourseId, [Validators.required]],  // Required field
      gradeLevel: [this.initialValue.gradeLevel || 'Grade 9', [Validators.required]],
      schedule: this.fb.array((this.initialValue.schedule || [{ day: 'saturday', startTime: '10:00', endTime: '12:00' }]).map((s: any) => this.fb.group({
        day: [s.day || 'saturday', Validators.required],
        startTime: [s.startTime || '10:00', Validators.required],
        endTime: [s.endTime || '12:00', Validators.required]
      }))),
      pricePerSession: [this.initialValue.pricePerSession ?? 0, [Validators.min(0)]],
      isActive: [this.initialValue.isActive ?? true]
    });

    // Load courses with teacher and subject info
    this.courseService.getCourses({ isActive: 'true', page: 1, limit: 100 }).subscribe({
      next: res => {
        const list = res.data || [];
        this.courses = Array.isArray(list) ? list : [];
        
        // If editing, find and set the selected course
        if (initialCourseId && this.courses.length > 0) {
          this.selectedCourse = this.courses.find(c => c._id === initialCourseId);
        }
      },
      error: err => { console.error('Failed to load courses:', err); this.courses = []; }
    });

    // Watch for course changes to update selected course and check conflicts
    this.form.get('course')?.valueChanges.pipe(distinctUntilChanged()).subscribe((courseId) => {
      this.selectedCourse = this.courses.find(c => c._id === courseId);
      this.checkScheduleConflicts();
    });
    
    // Watch for schedule changes to check for conflicts
    this.form.get('schedule')?.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.checkScheduleConflicts();
    });
  }

  get schedule(): FormArray { return this.form.get('schedule') as FormArray; }
  addSlot(): void { this.schedule.push(this.fb.group({ day: 'saturday', startTime: '10:00', endTime: '12:00' })); }
  removeSlot(i: number): void { this.schedule.removeAt(i); }

  checkScheduleConflicts(): void {
    const courseId = this.form.get('course')?.value;
    const schedule = this.form.get('schedule')?.value;

    if (!courseId || !schedule || schedule.length === 0) {
      this.scheduleConflicts = [];
      return;
    }

    // Validate schedule times
    const hasInvalidSchedule = schedule.some((slot: any) => 
      !slot.day || !slot.startTime || !slot.endTime
    );
    
    if (hasInvalidSchedule) {
      this.scheduleConflicts = [];
      return;
    }

    this.checkingConflicts = true;
    const excludeGroupId = this.initialValue?._id || this.initialValue?.id;

    this.groupService.checkScheduleConflict(courseId, schedule, excludeGroupId).subscribe({
      next: (response: any) => {
        this.checkingConflicts = false;
        if (response.success && response.data) {
          this.scheduleConflicts = response.data.conflicts || [];
          
          if (this.scheduleConflicts.length > 0) {
            this.toastService.warning(
              `⚠️ Schedule conflict detected with ${this.scheduleConflicts.length} other group(s)`,
              'Schedule Conflict',
              5000
            );
          }
        }
      },
      error: (error: any) => {
        this.checkingConflicts = false;
        console.error('Failed to check schedule conflicts:', error);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    
    if (this.scheduleConflicts.length > 0) {
      const confirmed = confirm(
        `⚠️ Warning: This schedule conflicts with ${this.scheduleConflicts.length} other group(s).\n\nDo you want to proceed anyway?`
      );
      if (!confirmed) return;
    }
    
    this.submitting = true;
    this.save.emit(this.form.value);
  }

  goBack(): void { this.router.navigate(['/dashboard/groups']); }
}


