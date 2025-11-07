import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GroupFormComponent } from '../group-form/group-form.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, GroupFormComponent],
  template: `
    <app-group-form
      [title]="translate.instant('groups.addGroup')"
      [subtitle]="translate.instant('groups.createGroupSubtitle')"
      [submitText]="translate.instant('groups.createGroup')"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-group-form>
  `
})
export class GroupCreateComponent {
  constructor(
    private groupService: GroupService, 
    private router: Router,
    public translate: TranslateService
  ) {}

  onSave(value: any): void {
    this.groupService.createGroup(value).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }

  onCancel(): void { this.router.navigate(['/dashboard/groups']); }
}


