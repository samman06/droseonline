import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <div class="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h1 class="text-3xl font-bold">{{ title }}</h1>
        <p class="text-indigo-100">{{ subtitle }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="px-8 py-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Subject Information</h2>
        </div>

        <div class="p-8 space-y-6">
          <div>
            <label class="form-label">Name</label>
            <input class="form-input" formControlName="name" placeholder="e.g., Mathematics" />
          </div>
          <div>
            <label class="form-label">Code <span class="text-xs text-gray-500">(Auto-generated)</span></label>
            <input class="form-input bg-gray-100 cursor-not-allowed" formControlName="code" placeholder="Auto-generated (e.g., SU-000001)" [disabled]="true" />
            <p class="text-xs text-gray-500 mt-1">Code will be automatically generated when you save</p>
          </div>

          <!-- Grades removed; assignment happens on groups -->

          <!-- No total marks on subject -->
        </div>

        <div class="flex justify-end space-x-3 px-8 py-6 bg-gray-50 border-t border-gray-200">
          <button type="button" (click)="cancel.emit()" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="form.invalid || submitting" class="btn-primary">
            {{ submitting ? 'Saving...' : submitText }}
          </button>
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
export class SubjectFormComponent implements OnInit {
  @Input() initialValue: any = {};
  @Input() title = 'Add Subject';
  @Input() subtitle = 'Create a new subject and assign grades';
  @Input() submitText = 'Create Subject';
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  submitting = false;

  // No grades

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.initialValue.name || '', [Validators.required, Validators.minLength(2)]],
      code: [{value: this.initialValue.code || '', disabled: true}], // Auto-generated, not required
      // no gradeLevels
      // no totalMarks
    });
  }

  // no toggleGrade

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.save.emit(this.form.value);
  }
}


