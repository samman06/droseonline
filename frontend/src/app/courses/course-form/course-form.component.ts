import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { SubjectService } from '../../services/subject.service';
import { TeacherService } from '../../services/teacher.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit' : 'Create' }} Course</h1>
        <p class="text-gray-600 mt-1">{{ isEditMode ? 'Update course information' : 'Set up a new course' }}</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <form *ngIf="!loading" [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Course Name <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                formControlName="name"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Introduction to Physics">
              <div *ngIf="courseForm.get('name')?.invalid && courseForm.get('name')?.touched" class="text-red-500 text-sm mt-1">
                Course name is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Course Code <span class="text-xs text-gray-500">(Auto-generated)</span>
              </label>
              <input 
                type="text" 
                formControlName="code"
                class="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                placeholder="Auto-generated (e.g., CO-000001)"
                [disabled]="true">
              <p class="text-xs text-gray-500 mt-1">Code will be automatically generated when you save</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                formControlName="description"
                rows="3"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter course description..."></textarea>
            </div>
          </div>
        </div>

        <!-- Course Details -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Course Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Subject <span class="text-red-500">*</span>
              </label>
              <select formControlName="subject" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">Select a subject</option>
                <option *ngFor="let subject of subjects" [value]="subject._id">
                  {{ subject.name }} ({{ subject.code }})
                </option>
              </select>
              <div *ngIf="courseForm.get('subject')?.invalid && courseForm.get('subject')?.touched" class="text-red-500 text-sm mt-1">
                Subject is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Teacher <span class="text-red-500">*</span>
              </label>
              <select formControlName="teacher" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">Select a teacher</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{ teacher.firstName }} {{ teacher.lastName }}
                </option>
              </select>
              <div *ngIf="courseForm.get('teacher')?.invalid && courseForm.get('teacher')?.touched" class="text-red-500 text-sm mt-1">
                Teacher is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                formControlName="academicYear"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 2024-2025">
              <div *ngIf="courseForm.get('academicYear')?.invalid && courseForm.get('academicYear')?.touched" class="text-red-500 text-sm mt-1">
                Academic year is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Credit Hours</label>
              <input 
                type="number" 
                formControlName="creditHours"
                min="0"
                step="0.5"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="3">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
              <input 
                type="number" 
                formControlName="maxStudents"
                min="1"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="30">
            </div>
          </div>
        </div>

        <!-- Course Duration -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Course Duration</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                type="date" 
                formControlName="startDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                type="date" 
                formControlName="endDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
          </div>
          
          <p class="mt-3 text-sm text-gray-500">
            ℹ️ Schedules are defined per section (group), not per course
          </p>
        </div>

        <!-- Status -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          
          <label class="flex items-center">
            <input type="checkbox" formControlName="isActive" 
                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <span class="ml-2 text-sm text-gray-700">Course is active</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3">
          <button 
            type="button" 
            (click)="cancel()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            Cancel
          </button>
          <button 
            type="submit" 
            [disabled]="saving || courseForm.invalid"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ saving ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course') }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class CourseFormComponent implements OnInit {
  courseForm!: FormGroup;
  isEditMode = false;
  courseId: string | null = null;
  loading = false;
  saving = false;
  currentUser: any;
  subjects: any[] = [];
  teachers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    this.loadSubjects();
    this.loadTeachers();
    
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.isEditMode = true;
      this.loadCourse();
    }
  }

  initForm(): void {
    this.courseForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [{value: '', disabled: true}], // Auto-generated, not required
      description: [''],
      subject: ['', Validators.required],
      teacher: ['', Validators.required],
      academicYear: ['', Validators.required],
      creditHours: [3],
      maxStudents: [30],
      startDate: [''],
      endDate: [''],
      isActive: [true]
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects({ limit: 100, isActive: 'true' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjects = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load subjects', error);
      }
    });
  }

  loadTeachers(): void {
    this.teacherService.getTeachers({ limit: 100, isActive: 'true' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load teachers', error);
      }
    });
  }

  loadCourse(): void {
    if (!this.courseId) return;
    
    this.loading = true;
    this.courseService.getCourse(this.courseId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const course = response.data;
          
          // Format dates for date inputs
          const startDate = course.startDate 
            ? new Date(course.startDate).toISOString().split('T')[0] 
            : '';
          const endDate = course.endDate 
            ? new Date(course.endDate).toISOString().split('T')[0] 
            : '';

          this.courseForm.patchValue({
            name: course.name,
            code: course.code,
            description: course.description,
            subject: course.subject,
            teacher: course.teacher,
            academicYear: course.academicYear,
            creditHours: course.creditHours,
            maxStudents: course.maxStudents,
            startDate,
            endDate,
            isActive: course.isActive
          });
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/courses']);
      }
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid || this.saving) return;

    const formData = this.prepareFormData();

    this.saving = true;
    const request = this.isEditMode && this.courseId
      ? this.courseService.updateCourse(this.courseId, formData)
      : this.courseService.createCourse(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.isEditMode ? 'Course updated successfully' : 'Course created successfully'
          );
          this.router.navigate(['/dashboard/courses']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  prepareFormData(): any {
    const formValue = this.courseForm.value;
    
    return {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description,
      subject: formValue.subject,
      teacher: formValue.teacher,
      academicYear: formValue.academicYear,
      creditHours: formValue.creditHours || 3,
      maxStudents: formValue.maxStudents || undefined,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      isActive: formValue.isActive
    };
  }

  cancel(): void {
    this.router.navigate(['/dashboard/courses']);
  }
}

