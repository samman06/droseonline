import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SubjectFormComponent } from '../subject-form/subject-form.component';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-create',
  standalone: true,
  imports: [CommonModule, SubjectFormComponent],
  template: `
    <app-subject-form
      [title]="translate.instant('subjects.addSubject')"
      [subtitle]="translate.instant('subjects.createSubtitle')"
      [submitText]="translate.instant('subjects.createSubject')"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-subject-form>
  `
})
export class SubjectCreateComponent {
  constructor(
    private subjectService: SubjectService, 
    private router: Router,
    public translate: TranslateService
  ) {}

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


