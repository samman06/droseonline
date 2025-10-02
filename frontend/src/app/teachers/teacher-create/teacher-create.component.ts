import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherFormComponent } from '../teacher-form/teacher-form.component';

@Component({
  selector: 'app-teacher-create',
  standalone: true,
  imports: [CommonModule, TeacherFormComponent],
  template: `<app-teacher-form [isEditMode]="false"></app-teacher-form>`
})
export class TeacherCreateComponent {}

