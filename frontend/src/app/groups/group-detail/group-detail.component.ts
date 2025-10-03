import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ group?.name }}</h1>
          <p class="text-gray-600">Code: {{ group?.code }} • Grade: {{ group?.gradeLevel }}</p>
        </div>
        <div class="space-x-3">
          <button (click)="edit()" class="btn-edit">Edit</button>
          <button (click)="delete()" class="btn-danger">Delete</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div class="text-gray-700"><span class="font-semibold">Teacher:</span> {{ group?.teacher?.fullName || '—' }}</div>
          <div class="text-gray-700"><span class="font-semibold">Subject:</span> {{ group?.subject?.name || '—' }} ({{ group?.subject?.code }})</div>
          <div class="text-gray-700"><span class="font-semibold">Price/Session:</span> {{ group?.pricePerSession | currency:'EGP':'symbol-narrow' }}</div>
          <div class="text-gray-700"><span class="font-semibold">Students:</span> {{ group?.currentEnrollment }}</div>
          <div class="mt-3"><span class="font-semibold">Status:</span>
            <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="group?.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
              <span class="w-2 h-2 rounded-full mr-2" [class]="group?.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
              {{ group?.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let s of group?.schedule" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {{ s.day | titlecase }} {{ s.startTime }}-{{ s.endTime }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-edit { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200; }
    .btn-danger { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-red-600 hover:bg-red-50 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200; }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: any;

  constructor(private groupService: GroupService, private route: ActivatedRoute, private router: Router, private confirmation: ConfirmationService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupService.getGroup(id).subscribe({ next: res => this.group = res.data?.group });
  }

  edit(): void { this.router.navigate(['/dashboard/groups', this.group?.id || this.group?._id, 'edit']); }

  async delete(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Delete Group', message: `Delete ${this.group?.name}?`, confirmText: 'Yes, Delete', cancelText: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    this.groupService.deleteGroup(this.group?.id || this.group?._id).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }
}


