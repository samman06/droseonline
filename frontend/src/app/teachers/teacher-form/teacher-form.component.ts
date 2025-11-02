import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../services/toast.service';

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
    subjects?: any[];
    groups?: string[];
  };
  isActive: boolean;
}

interface Subject {
  _id: string;
  id?: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="max-w-5xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button (click)="goBack()" class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {{ (isEditMode ? 'teachers.editTeacherTitle' : 'teachers.addNewTeacherTitle') | translate }}
              </h1>
              <p class="text-gray-600 mt-1">{{ (isEditMode ? 'teachers.updateInfo' : 'teachers.createProfile') | translate }}</p>
            </div>
          </div>
          <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="teacherForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Personal Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <h3 class="text-lg font-bold text-gray-900">{{ 'teachers.personalInformation' | translate }}</h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="form-label">{{ 'teachers.firstName' | translate }} *</label>
                <input type="text" formControlName="firstName" class="form-input" [placeholder]="'teachers.enterFirstName' | translate">
              </div>
              <div>
                <label class="form-label">{{ 'teachers.lastName' | translate }} *</label>
                <input type="text" formControlName="lastName" class="form-input" [placeholder]="'teachers.enterLastName' | translate">
              </div>
              <div>
                <label class="form-label">{{ 'teachers.email' | translate }} *</label>
                <input type="email" formControlName="email" class="form-input" [placeholder]="'teachers.enterEmail' | translate">
              </div>
              <div>
                <label class="form-label">{{ 'teachers.phoneNumber' | translate }}</label>
                <input type="tel" formControlName="phoneNumber" class="form-input" [placeholder]="'teachers.enterPhone' | translate">
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" formGroupName="academicInfo">
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-lg font-bold text-gray-900">{{ 'teachers.academicInformation' | translate }}</h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="form-label">{{ 'teachers.employeeIdLabel' | translate }} <span class="text-xs text-gray-500">({{ 'teachers.autoGenerated' | translate }})</span></label>
                <input type="text" formControlName="employeeId" class="form-input bg-gray-100 cursor-not-allowed" placeholder="Auto-generated (e.g., TE-000001)" [disabled]="true">
                <p class="text-xs text-gray-500 mt-1">Employee ID will be automatically generated when you save</p>
              </div>
              <div>
                <label class="form-label">{{ 'teachers.hireDateLabel' | translate }} *</label>
                <input type="date" formControlName="hireDate" class="form-input">
              </div>
              <div class="md:col-span-2">
                <label class="form-label">Subjects <span class="text-xs text-gray-500">(Select subjects this teacher can teach)</span></label>
                <div *ngIf="isLoadingSubjects" class="text-sm text-gray-500">Loading subjects...</div>
                <div *ngIf="!isLoadingSubjects && subjects.length === 0" class="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  No subjects available. Please create subjects first.
                </div>
                <div *ngIf="!isLoadingSubjects && subjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <label *ngFor="let subject of subjects" class="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      [checked]="isSubjectSelected(subject._id || subject.id || '')"
                      (change)="toggleSubject(subject._id || subject.id || '')"
                      class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                    >
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-gray-900">{{ subject.name }}</div>
                      <div class="text-xs text-gray-500 font-mono">{{ subject.code }}</div>
                    </div>
                  </label>
                </div>
                <div *ngIf="selectedSubjectIds.length > 0" class="mt-2 flex flex-wrap gap-2">
                  <span *ngFor="let subjectId of selectedSubjectIds" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {{ getSubjectName(subjectId) }}
                    <button type="button" (click)="toggleSubject(subjectId)" class="ml-2 text-indigo-600 hover:text-indigo-800 font-bold">×</button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button type="button" (click)="onCancel()" class="btn-secondary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            {{ 'teachers.cancel' | translate }}
          </button>
          <button type="submit" [disabled]="teacherForm.invalid || isSubmitting" class="btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ isSubmitting ? ('teachers.saving' | translate) : ((isEditMode ? 'teachers.updateTeacher' : 'teachers.createTeacher') | translate) }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-label { @apply block text-sm font-semibold text-gray-700 mb-2; }
    .form-input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200; }
    .btn-primary { 
      @apply inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white 
      bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
      disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200;
    }
    .btn-secondary { 
      @apply inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold 
      rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200;
    }
  `]
})
export class TeacherFormComponent implements OnInit {
  @Input() teacher?: Teacher;
  @Input() isEditMode: boolean = false;

  teacherForm!: FormGroup;
  isSubmitting = false;
  subjects: Subject[] = [];
  selectedSubjectIds: string[] = [];
  isLoadingSubjects = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSubjects();
    if (this.teacher && this.isEditMode) {
      this.populateForm(this.teacher);
    }
  }

  loadSubjects(): void {
    this.isLoadingSubjects = true;
    this.subjectService.getSubjects({ isActive: true, page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subjects = response.data.subjects || response.data || [];
        }
        this.isLoadingSubjects = false;
      },
      error: () => {
        this.isLoadingSubjects = false;
      }
    });
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
        employeeId: [{value: '', disabled: true}], // Auto-generated, not required
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
    
    // Pre-select subjects when editing
    if (teacher.academicInfo?.subjects && Array.isArray(teacher.academicInfo.subjects)) {
      this.selectedSubjectIds = teacher.academicInfo.subjects.map((s: any) => 
        typeof s === 'string' ? s : (s._id || s.id)
      );
    }
  }

  onSubmit(): void {
    if (this.teacherForm.valid) {
      this.isSubmitting = true;
      const teacherData = {
        ...this.teacherForm.value,
        academicInfo: {
          ...this.teacherForm.value.academicInfo,
          subjects: this.selectedSubjectIds
        }
      };

      const request = this.isEditMode && this.teacher?.id
        ? this.teacherService.updateTeacher(this.teacher.id, teacherData)
        : this.teacherService.createTeacher(teacherData);

      request.subscribe({
        next: () => {
          if (this.isEditMode) {
            this.toastService.showUpdateSuccess('Teacher');
          } else {
            this.toastService.showCreateSuccess('Teacher');
          }
          this.router.navigate(['/dashboard/teachers']);
        },
        error: (error) => {
          this.toastService.showApiError(error);
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

  toggleSubject(subjectId: string): void {
    const index = this.selectedSubjectIds.indexOf(subjectId);
    if (index > -1) {
      this.selectedSubjectIds.splice(index, 1);
    } else {
      this.selectedSubjectIds.push(subjectId);
    }
  }

  isSubjectSelected(subjectId: string): boolean {
    return this.selectedSubjectIds.includes(subjectId);
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => (s._id || s.id) === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown';
  }
}

