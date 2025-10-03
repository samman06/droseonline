import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GroupFormComponent } from '../group-form/group-form.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, GroupFormComponent],
  template: `
    <app-group-form
      [title]="'Add Group'"
      [subtitle]="'Create a weekly group with teacher, subject, and grade'"
      [submitText]="'Create Group'"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-group-form>
  `
})
export class GroupCreateComponent {
  constructor(private groupService: GroupService, private router: Router) {}

  onSave(value: any): void {
    this.groupService.createGroup(value).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }

  onCancel(): void { this.router.navigate(['/dashboard/groups']); }
}


