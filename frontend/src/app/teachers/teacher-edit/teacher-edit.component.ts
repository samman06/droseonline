import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeacherFormComponent } from '../teacher-form/teacher-form.component';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-teacher-edit',
  standalone: true,
  imports: [CommonModule, TeacherFormComponent],
  template: `
    <div *ngIf="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    <app-teacher-form *ngIf="teacher && !isLoading" [teacher]="teacher" [isEditMode]="true"></app-teacher-form>
  `
})
export class TeacherEditComponent implements OnInit {
  teacher: any;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.teacherService.getTeacher(id).subscribe({
      next: (response) => {
        this.teacher = response.data.teacher || response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}

