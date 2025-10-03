import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubjectFormComponent } from '../subject-form/subject-form.component';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-create',
  standalone: true,
  imports: [CommonModule, SubjectFormComponent],
  template: `
    <app-subject-form
      [title]="'Add Subject'"
      [subtitle]="'Create a new subject and assign grades'"
      [submitText]="'Create Subject'"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-subject-form>
  `
})
export class SubjectCreateComponent {
  constructor(private subjectService: SubjectService, private router: Router) {}

  onSave(formValue: any): void {
    this.subjectService.createSubject(formValue).subscribe({
      next: (_res) => this.router.navigate(['/dashboard/subjects']),
      error: (_err) => {}
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/subjects']);
  }
}


