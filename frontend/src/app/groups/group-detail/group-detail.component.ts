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
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">Back to Groups</span>
        </button>
      </div>

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
          <div class="space-y-2">
            <div class="text-gray-700"><span class="font-semibold">Teacher:</span> {{ group?.teacher?.fullName || '—' }}</div>
            <div class="text-gray-700"><span class="font-semibold">Subject:</span> {{ group?.subject?.name || '—' }} ({{ group?.subject?.code }})</div>
            <div *ngIf="group?.course" class="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
                </svg>
                <div>
                  <p class="font-semibold text-blue-900">Linked Course</p>
                  <p class="text-sm text-blue-700">{{ group?.course?.name }} ({{ group?.course?.code }})</p>
                  <p class="text-xs text-blue-600">{{ group?.course?.semester | titlecase }} Semester</p>
                </div>
              </div>
            </div>
            <div class="text-gray-700"><span class="font-semibold">Price/Session:</span> {{ group?.pricePerSession | currency:'EGP':'symbol-narrow' }}</div>
            <div class="text-gray-700"><span class="font-semibold">Students:</span> {{ group?.currentEnrollment }}</div>
            <div class="mt-3"><span class="font-semibold">Status:</span>
              <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="group?.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
                <span class="w-2 h-2 rounded-full mr-2" [class]="group?.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
                {{ group?.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
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

  goBack(): void {
    this.router.navigate(['/dashboard/groups']);
  }

  edit(): void { this.router.navigate(['/dashboard/groups', this.group?.id || this.group?._id, 'edit']); }

  async delete(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Delete Group', message: `Delete ${this.group?.name}?`, confirmText: 'Yes, Delete', cancelText: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    this.groupService.deleteGroup(this.group?.id || this.group?._id).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }
}


