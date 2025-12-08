import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GroupFormComponent } from '../group-form/group-form.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-edit',
  standalone: true,
  imports: [CommonModule, GroupFormComponent, TranslateModule],
  template: `
    <app-group-form
      [title]="translate.instant('groups.editGroup')"
      [subtitle]="translate.instant('groups.updateGroupSubtitle')"
      [submitText]="translate.instant('groups.updateGroup')"
      [initialValue]="group"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-group-form>
  `
})
export class GroupEditComponent implements OnInit {
  group: any = {};

  constructor(
    private groupService: GroupService, 
    private route: ActivatedRoute, 
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupService.getGroup(id).subscribe({ next: res => this.group = res.data?.group || {} });
  }

  onSave(value: any): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupService.updateGroup(id, value).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }

  onCancel(): void { this.router.navigate(['/dashboard/groups']); }
}


