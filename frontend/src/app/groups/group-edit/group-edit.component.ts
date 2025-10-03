import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupFormComponent } from '../group-form/group-form.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-edit',
  standalone: true,
  imports: [CommonModule, GroupFormComponent],
  template: `
    <app-group-form
      [title]="'Edit Group'"
      [subtitle]="'Update group details and schedule'"
      [submitText]="'Update Group'"
      [initialValue]="group"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-group-form>
  `
})
export class GroupEditComponent implements OnInit {
  group: any = {};

  constructor(private groupService: GroupService, private route: ActivatedRoute, private router: Router) {}

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


