import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

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

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="form-label">Teacher</label>
              <select class="form-input" formControlName="teacher">
                <option value="" disabled>Select a teacher</option>
                <option *ngFor="let t of teachers" [value]="t.id || t._id">{{ t.fullName || (t.firstName + ' ' + t.lastName) }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Subject</label>
              <select class="form-input" formControlName="subject">
                <option value="" disabled>Select a subject</option>
                <option *ngFor="let s of subjects" [value]="s.id || s._id">{{ s.name }} ({{ s.code }})</option>
              </select>
            </div>
            <div>
              <label class="form-label">Grade</label>
              <select class="form-input" formControlName="gradeLevel">
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">Weekly Schedule</label>
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
  teachers: any[] = [];
  subjects: any[] = [];

  constructor(private fb: FormBuilder, private teacherService: TeacherService, private subjectService: SubjectService, private router: Router) {}

  ngOnInit(): void {
    // Normalize initial IDs if objects were provided
    const initialTeacherId = this.initialValue.teacher?._id || this.initialValue.teacher || '';
    const initialSubjectId = this.initialValue.subject?._id || this.initialValue.subject || '';

    this.form = this.fb.group({
      name: [this.initialValue.name || '', [Validators.required, Validators.minLength(2)]],
      code: [this.initialValue.code || '', [Validators.required]],
      teacher: [initialTeacherId, [Validators.required]],
      subject: [initialSubjectId, [Validators.required]],
      gradeLevel: [this.initialValue.gradeLevel || 'Grade 9', [Validators.required]],
      schedule: this.fb.array((this.initialValue.schedule || [{ day: 'saturday', startTime: '10:00', endTime: '12:00' }]).map((s: any) => this.fb.group({
        day: [s.day || 'saturday', Validators.required],
        startTime: [s.startTime || '10:00', Validators.required],
        endTime: [s.endTime || '12:00', Validators.required]
      }))),
      pricePerSession: [this.initialValue.pricePerSession ?? 0, [Validators.min(0)]],
      isActive: [this.initialValue.isActive ?? true]
    });

    // Load dropdown options
    this.teacherService.getTeachers({ isActive: 'true', page: 1, limit: 100 }).subscribe({
      next: res => {
        const list = res.data?.teachers || res.data || [];
        this.teachers = Array.isArray(list) ? list : [];
      },
      error: err => { console.error('Failed to load teachers:', err); this.teachers = []; }
    });
    this.subjectService.getSubjects({ isActive: 'true', page: 1, limit: 100 }).subscribe({
      next: res => {
        const list = res.data?.subjects || res.data || [];
        this.subjects = Array.isArray(list) ? list : [];
      },
      error: err => { console.error('Failed to load subjects:', err); this.subjects = []; }
    });
  }

  get schedule(): FormArray { return this.form.get('schedule') as FormArray; }
  addSlot(): void { this.schedule.push(this.fb.group({ day: 'saturday', startTime: '10:00', endTime: '12:00' })); }
  removeSlot(i: number): void { this.schedule.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.save.emit(this.form.value);
  }

  goBack(): void { this.router.navigate(['/dashboard/groups']); }
}


