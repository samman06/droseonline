import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { GroupService } from '../../services/group.service';
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Code <span class="text-xs text-gray-500">(Auto-generated)</span>
                </label>
                <input 
                  type="text" 
                  formControlName="code"
                  class="w-full rounded-lg border-gray-300 bg-gray-100 cursor-not-allowed shadow-sm"
                  placeholder="Auto-generated (e.g., AS-000001)"
                  [disabled]="true">
                <p class="text-xs text-gray-500 mt-1">Code will be automatically generated when you save</p>
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
                  Groups <span class="text-red-500">*</span>
                </label>
                
                <!-- Custom Multi-Select Dropdown -->
                <div class="relative">
                  <button
                    type="button"
                    (click)="toggleGroupsDropdown()"
                    class="w-full px-4 py-2.5 text-left bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all flex items-center justify-between"
                    [ngClass]="{'border-red-500': assignmentForm.get('groups')?.invalid && assignmentForm.get('groups')?.touched}">
                    <span class="text-gray-700">
                      <span *ngIf="selectedGroups.length === 0" class="text-gray-400">Select groups...</span>
                      <span *ngIf="selectedGroups.length > 0">{{ selectedGroups.length }} group(s) selected</span>
                    </span>
                    <svg class="w-5 h-5 text-gray-400 transition-transform" [class.rotate-180]="showGroupsDropdown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div *ngIf="showGroupsDropdown" class="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <div *ngIf="groups.length === 0" class="px-4 py-3 text-sm text-gray-500 text-center">
                      No groups available
                    </div>
                    <div *ngFor="let group of groups" 
                         (click)="toggleGroupSelection(group)"
                         class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors">
                      <label class="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          [checked]="isGroupSelected(group._id)"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          (click)="$event.stopPropagation()">
                        <div class="ml-3 flex-1">
                          <div class="text-sm font-medium text-gray-900">{{ group.name }}</div>
                          <div class="text-xs text-gray-500">{{ group.code }} • {{ group.gradeLevel }}</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Selected Groups Display -->
                <div *ngIf="selectedGroups.length > 0" class="mt-2 flex flex-wrap gap-2">
                  <span *ngFor="let group of selectedGroups" 
                        class="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
                    {{ group.name }} ({{ group.code }})
                    <button 
                      type="button"
                      (click)="removeGroupSelection(group._id)"
                      class="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </span>
                </div>
                
                <p class="text-xs text-gray-500 mt-2">
                  <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  Click to select multiple groups. All groups must belong to the same course.
                </p>
                
                <div *ngIf="assignmentForm.get('groups')?.invalid && assignmentForm.get('groups')?.touched" class="flex items-center text-red-600 text-sm mt-2">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  At least one group is required
                </div>
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
  groups: any[] = [];
  selectedGroups: any[] = [];
  showGroupsDropdown = false;

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private groupService: GroupService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    this.loadGroups();
    
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    if (this.assignmentId) {
      this.isEditMode = true;
      this.loadAssignment();
    }
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      code: [{value: '', disabled: true}], // Auto-generated, not required
      title: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      type: ['homework', Validators.required],
      groups: [[], [Validators.required, Validators.minLength(1)]], // Groups are required
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

  loadGroups(): void {
    this.groupService.getGroups({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested response structure
          this.groups = response.data.groups || response.data || [];
          console.log('Loaded groups:', this.groups.length);
        }
      },
      error: (error) => {
        console.error('Failed to load groups', error);
        this.toastService.error('Failed to load groups');
      }
    });
  }

  toggleGroupsDropdown(): void {
    this.showGroupsDropdown = !this.showGroupsDropdown;
  }

  toggleGroupSelection(group: any): void {
    const index = this.selectedGroups.findIndex(g => g._id === group._id);
    if (index > -1) {
      // Remove group
      this.selectedGroups.splice(index, 1);
    } else {
      // Add group
      this.selectedGroups.push(group);
    }
    // Update form control
    this.assignmentForm.patchValue({
      groups: this.selectedGroups.map(g => g._id)
    });
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups.some(g => g._id === groupId);
  }

  removeGroupSelection(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(g => g._id !== groupId);
    // Update form control
    this.assignmentForm.patchValue({
      groups: this.selectedGroups.map(g => g._id)
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

