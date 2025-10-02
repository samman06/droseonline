import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: { city?: string; };
  academicInfo: {
    employeeId: string;
    hireDate: Date;
    subjects?: string[];
    groups?: string[];
  };
  isActive: boolean;
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <button (click)="goBack()" class="btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back
        </button>
        <h2 class="text-xl font-bold">{{ isEditMode ? 'Edit Teacher' : 'Add Teacher' }}</h2>
      </div>

      <div class="card">
        <form [formGroup]="teacherForm" (ngSubmit)="onSubmit()" class="card-body space-y-6">
          <!-- Personal Info -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Personal Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">First Name *</label>
                <input type="text" formControlName="firstName" class="form-input">
              </div>
              <div>
                <label class="form-label">Last Name *</label>
                <input type="text" formControlName="lastName" class="form-input">
              </div>
              <div>
                <label class="form-label">Email *</label>
                <input type="email" formControlName="email" class="form-input">
              </div>
              <div>
                <label class="form-label">Phone</label>
                <input type="tel" formControlName="phoneNumber" class="form-input">
              </div>
            </div>
          </div>

          <!-- Academic Info -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="academicInfo">
            <h3 class="text-lg font-medium mb-4">Academic Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Employee ID *</label>
                <input type="text" formControlName="employeeId" class="form-input">
              </div>
              <div>
                <label class="form-label">Hire Date *</label>
                <input type="date" formControlName="hireDate" class="form-input">
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-2">Subjects and groups will be assigned separately</p>
          </div>

          <div class="flex justify-end space-x-4">
            <button type="button" (click)="onCancel()" class="btn-secondary">Cancel</button>
            <button type="submit" [disabled]="teacherForm.invalid || isSubmitting" class="btn-primary">
              {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-label { @apply block text-sm font-medium text-gray-700 mb-1; }
    .form-input { @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500; }
    .form-select { @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500; }
    .btn-primary { @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50; }
    .btn-secondary { @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50; }
    .card { @apply bg-white shadow-sm rounded-lg border border-gray-200; }
    .card-body { @apply px-6 py-4; }
  `]
})
export class TeacherFormComponent implements OnInit {
  @Input() teacher?: Teacher;
  @Input() isEditMode: boolean = false;

  teacherForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.teacher && this.isEditMode) {
      this.populateForm(this.teacher);
    }
  }

  initializeForm(): void {
    this.teacherForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      dateOfBirth: [''],
      isActive: [true],
      address: this.fb.group({
        city: ['']
      }),
      academicInfo: this.fb.group({
        employeeId: ['', Validators.required],
        hireDate: ['', Validators.required]
      })
    });
  }

  populateForm(teacher: Teacher): void {
    this.teacherForm.patchValue({
      ...teacher,
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      academicInfo: {
        ...teacher.academicInfo,
        hireDate: teacher.academicInfo.hireDate ? new Date(teacher.academicInfo.hireDate).toISOString().split('T')[0] : ''
      }
    });
  }

  onSubmit(): void {
    if (this.teacherForm.valid) {
      this.isSubmitting = true;
      const teacherData = this.teacherForm.value;

      const request = this.isEditMode && this.teacher?.id
        ? this.teacherService.updateTeacher(this.teacher.id, teacherData)
        : this.teacherService.createTeacher(teacherData);

      request.subscribe({
        next: () => {
          alert(`Teacher ${this.isEditMode ? 'updated' : 'created'} successfully!`);
          this.router.navigate(['/dashboard/teachers']);
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to save teacher');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/teachers']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teachers']);
  }
}

