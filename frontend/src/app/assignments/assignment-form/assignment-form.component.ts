import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit' : 'Create' }} Assignment</h1>
        <p class="text-gray-600 mt-1">{{ isEditMode ? 'Update assignment details' : 'Create a new assignment for students' }}</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <form *ngIf="!loading" [formGroup]="assignmentForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                formControlName="title"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter assignment title">
              <div *ngIf="assignmentForm.get('title')?.invalid && assignmentForm.get('title')?.touched" class="text-red-500 text-sm mt-1">
                Title is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description <span class="text-red-500">*</span>
              </label>
              <textarea 
                formControlName="description"
                rows="4"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter detailed description of the assignment"></textarea>
              <div *ngIf="assignmentForm.get('description')?.invalid && assignmentForm.get('description')?.touched" class="text-red-500 text-sm mt-1">
                Description is required (minimum 20 characters)
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type <span class="text-red-500">*</span>
                </label>
                <select formControlName="type" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="project">Project</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select formControlName="course" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select a course</option>
                  <option *ngFor="let course of courses" [value]="course._id">
                    {{ course.name }} ({{ course.code }})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Dates and Points -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Schedule & Grading</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span class="text-red-500">*</span>
              </label>
              <input 
                type="datetime-local" 
                formControlName="dueDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <div *ngIf="assignmentForm.get('dueDate')?.invalid && assignmentForm.get('dueDate')?.touched" class="text-red-500 text-sm mt-1">
                Due date is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Max Points <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                formControlName="maxPoints"
                min="1"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="100">
              <div *ngIf="assignmentForm.get('maxPoints')?.invalid && assignmentForm.get('maxPoints')?.touched" class="text-red-500 text-sm mt-1">
                Max points is required (minimum 1)
              </div>
            </div>
          </div>
        </div>

        <!-- Grading Rubric -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Grading Rubric</h2>
            <button 
              type="button" 
              (click)="addRubricCriterion()"
              class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Criterion
            </button>
          </div>

          <div formArrayName="rubric" class="space-y-3">
            <div *ngFor="let criterion of rubric.controls; let i = index" [formGroupName]="i" 
                 class="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <input 
                  type="text" 
                  formControlName="name"
                  class="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Criterion name">
              </div>
              <div class="w-24">
                <input 
                  type="number" 
                  formControlName="points"
                  min="0"
                  class="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Points">
              </div>
              <button 
                type="button" 
                (click)="removeRubricCriterion(i)"
                class="text-red-600 hover:text-red-800 p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div *ngIf="rubric.length === 0" class="text-center py-6 text-gray-500 text-sm">
            No rubric criteria added. Click "Add Criterion" to create grading criteria.
          </div>
        </div>

        <!-- Submission Settings -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Submission Settings</h2>
          
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" formControlName="allowLateSubmissions" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Allow late submissions</span>
            </label>

            <div *ngIf="assignmentForm.get('allowLateSubmissions')?.value" class="ml-6 mt-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Late Penalty (%)</label>
              <input 
                type="number" 
                formControlName="latePenalty"
                min="0"
                max="100"
                class="w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="10">
            </div>

            <label class="flex items-center">
              <input type="checkbox" formControlName="requireFileUpload" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Require file upload</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" formControlName="allowMultipleSubmissions" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Allow multiple submissions (students can resubmit)</span>
            </label>
          </div>
        </div>

        <!-- Instructions -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Additional Instructions</h2>
          <textarea 
            formControlName="instructions"
            rows="6"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter detailed instructions, requirements, or guidelines for students..."></textarea>
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
            *ngIf="!isEditMode"
            type="button" 
            (click)="saveDraft()"
            [disabled]="saving"
            class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50">
            Save as Draft
          </button>
          <button 
            type="submit" 
            [disabled]="saving || assignmentForm.invalid"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ saving ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Publish Assignment') }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class AssignmentFormComponent implements OnInit {
  assignmentForm!: FormGroup;
  isEditMode = false;
  assignmentId: string | null = null;
  loading = false;
  saving = false;
  currentUser: any;
  courses: any[] = [];

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    this.loadCourses();
    
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    if (this.assignmentId) {
      this.isEditMode = true;
      this.loadAssignment();
    }
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      type: ['homework', Validators.required],
      course: [''],
      dueDate: ['', Validators.required],
      maxPoints: [100, [Validators.required, Validators.min(1)]],
      rubric: this.fb.array([]),
      allowLateSubmissions: [true],
      latePenalty: [10],
      requireFileUpload: [false],
      allowMultipleSubmissions: [true],
      instructions: ['']
    });
  }

  get rubric(): FormArray {
    return this.assignmentForm.get('rubric') as FormArray;
  }

  addRubricCriterion(): void {
    const criterion = this.fb.group({
      name: ['', Validators.required],
      points: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
    this.rubric.push(criterion);
  }

  removeRubricCriterion(index: number): void {
    this.rubric.removeAt(index);
  }

  loadCourses(): void {
    this.courseService.getCourses({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load courses', error);
      }
    });
  }

  loadAssignment(): void {
    if (!this.assignmentId) return;
    
    this.loading = true;
    this.assignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const assignment = response.data;
          
          // Format due date for datetime-local input
          const dueDate = assignment.dueDate 
            ? new Date(assignment.dueDate).toISOString().slice(0, 16) 
            : '';

          this.assignmentForm.patchValue({
            title: assignment.title,
            description: assignment.description,
            type: assignment.type,
            course: assignment.course,
            dueDate,
            maxPoints: assignment.maxPoints,
            allowLateSubmissions: assignment.allowLateSubmissions,
            latePenalty: assignment.latePenalty || 10,
            requireFileUpload: assignment.requireFileUpload,
            allowMultipleSubmissions: assignment.allowMultipleSubmissions,
            instructions: assignment.instructions
          });

          // Load rubric criteria
          if (assignment.rubric && assignment.rubric.length > 0) {
            assignment.rubric.forEach((criterion: any) => {
              const criterionGroup = this.fb.group({
                name: [criterion.name, Validators.required],
                points: [criterion.points, [Validators.required, Validators.min(0)]],
                description: [criterion.description || '']
              });
              this.rubric.push(criterionGroup);
            });
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/assignments']);
      }
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid || this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'published';

    this.saving = true;
    const request = this.isEditMode && this.assignmentId
      ? this.assignmentService.updateAssignment(this.assignmentId, formData)
      : this.assignmentService.createAssignment(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.isEditMode ? 'Assignment updated successfully' : 'Assignment published successfully'
          );
          this.router.navigate(['/dashboard/assignments']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  saveDraft(): void {
    if (this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'draft';

    this.saving = true;
    this.assignmentService.createAssignment(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Assignment saved as draft');
          this.router.navigate(['/dashboard/assignments']);
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
    const formValue = this.assignmentForm.value;
    
    return {
      title: formValue.title,
      description: formValue.description,
      type: formValue.type,
      course: formValue.course || undefined,
      dueDate: formValue.dueDate,
      maxPoints: formValue.maxPoints,
      rubric: formValue.rubric,
      allowLateSubmissions: formValue.allowLateSubmissions,
      latePenalty: formValue.allowLateSubmissions ? formValue.latePenalty : 0,
      requireFileUpload: formValue.requireFileUpload,
      allowMultipleSubmissions: formValue.allowMultipleSubmissions,
      instructions: formValue.instructions
    };
  }

  cancel(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

