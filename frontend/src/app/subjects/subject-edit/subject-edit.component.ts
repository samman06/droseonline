import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SubjectFormComponent } from '../subject-form/subject-form.component';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-edit',
  standalone: true,
  imports: [CommonModule, SubjectFormComponent],
  template: `
    <app-subject-form
      [title]="translate.instant('subjects.editSubject')"
      [subtitle]="translate.instant('subjects.updateSubtitle')"
      [submitText]="translate.instant('subjects.updateSubject')"
      [initialValue]="subject"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-subject-form>
  `
})
export class SubjectEditComponent implements OnInit {
  subject: any = {};

  constructor(
    private subjectService: SubjectService, 
    private route: ActivatedRoute, 
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.subjectService.getSubject(id).subscribe({
      next: (res) => { this.subject = res.data?.subject || {}; },
      error: (_err) => {}
    });
  }

  onSave(formValue: any): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.subjectService.updateSubject(id, formValue).subscribe({
      next: (_res) => this.router.navigate(['/dashboard/subjects']),
      error: (_err) => {}
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/subjects']);
  }
}


