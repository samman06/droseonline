import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Back Button -->
      <div class="mb-4">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">Back to Groups</span>
        </button>
      </div>

      <!-- Header Banner with Gradient -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-4">
            <div class="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-4xl font-bold mb-2">{{ group?.name }}</h1>
              <div class="flex items-center space-x-4 text-indigo-100">
                <span class="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm font-mono text-sm font-semibold">
                  {{ group?.code }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm text-sm font-semibold">
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  {{ group?.gradeLevel }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="clone()" class="btn-clone-white" title="Create a new section with different schedule">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Clone Section
            </button>
            <button (click)="edit()" class="btn-edit-white">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Edit
            </button>
            <button (click)="delete()" class="btn-danger-white">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-blue-600 uppercase tracking-wide">Students</p>
              <p class="text-3xl font-bold text-blue-900 mt-2">{{ group?.students?.length || 0 }}</p>
            </div>
            <div class="p-3 bg-blue-200 rounded-xl">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-purple-600 uppercase tracking-wide">Sessions/Week</p>
              <p class="text-3xl font-bold text-purple-900 mt-2">{{ group?.schedule?.length || 0 }}</p>
            </div>
            <div class="p-3 bg-purple-200 rounded-xl">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-green-600 uppercase tracking-wide">Price/Session</p>
              <p class="text-3xl font-bold text-green-900 mt-2">{{ group?.pricePerSession || 0 }}</p>
              <p class="text-xs text-green-600 mt-1">EGP</p>
            </div>
            <div class="p-3 bg-green-200 rounded-xl">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-orange-600 uppercase tracking-wide">Total Hours</p>
              <p class="text-3xl font-bold text-orange-900 mt-2">{{ getTotalWeeklyHours() }}</p>
              <p class="text-xs text-orange-600 mt-1">hours/week</p>
            </div>
            <div class="p-3 bg-orange-200 rounded-xl">
              <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Course Information -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
              </svg>
              <h2 class="text-xl font-bold text-white">Course Information</h2>
            </div>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ group?.course?.name }}</p>
                <p class="text-sm text-gray-600 font-mono mt-1">{{ group?.course?.code }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p class="text-sm font-semibold text-gray-500 mb-1">Teacher</p>
                  <p class="text-base font-medium text-gray-900">{{ group?.course?.teacher?.fullName || '—' }}</p>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-500 mb-1">Subject</p>
                  <p class="text-base font-medium text-gray-900">{{ group?.course?.subject?.name || '—' }}</p>
                  <p class="text-xs text-gray-500 font-mono">{{ group?.course?.subject?.code }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Schedule -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <h2 class="text-xl font-bold text-white">Weekly Schedule</h2>
            </div>
          </div>
          <div class="p-6">
            <div class="flex flex-wrap gap-3">
              <div *ngFor="let s of group?.schedule" 
                   class="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm border transition-all duration-200 hover:shadow-md"
                   [ngClass]="getDayColorClass(s.day)">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>{{ s.day | titlecase }}: {{ s.startTime }}-{{ s.endTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrolled Students Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <h2 class="text-xl font-bold text-white">Enrolled Students</h2>
            </div>
            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-white font-bold text-sm">
              {{ group?.students?.length || 0 }}
            </span>
          </div>
        </div>
        
        <div *ngIf="!group?.students || group?.students?.length === 0" class="p-12 text-center">
          <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="text-gray-500 text-lg font-medium">No students enrolled yet</p>
          <p class="text-gray-400 text-sm mt-1">Students will appear here once they enroll in this group</p>
        </div>

        <div *ngIf="group?.students && group?.students?.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Phone</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent Phone</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enrollment Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let studentEnrollment of group?.students; let i = index" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ i + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-mono font-semibold text-gray-900">{{ studentEnrollment?.student?.academicInfo?.studentId || '—' }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                      {{ getInitials(studentEnrollment?.student?.firstName, studentEnrollment?.student?.lastName) }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ studentEnrollment?.student?.fullName || (studentEnrollment?.student?.firstName + ' ' + studentEnrollment?.student?.lastName) || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span>{{ studentEnrollment?.student?.phoneNumber || '—' }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span>{{ studentEnrollment?.student?.parentContact?.primaryPhone || '—' }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ studentEnrollment?.enrollmentDate ? (studentEnrollment?.enrollmentDate | date:'MMM d, yyyy') : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-clone-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm border-2 border-white border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200; }
    .btn-edit-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm border-2 border-white border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200; }
    .btn-danger-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-500 bg-opacity-90 text-white hover:bg-opacity-100 backdrop-blur-sm border-2 border-red-600 shadow-lg hover:shadow-xl transition-all duration-200; }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: any;

  constructor(
    private groupService: GroupService, 
    private route: ActivatedRoute, 
    private router: Router, 
    private confirmation: ConfirmationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupService.getGroup(id).subscribe({ next: res => this.group = res.data?.group });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/groups']);
  }

  edit(): void { this.router.navigate(['/dashboard/groups', this.group?.id || this.group?._id, 'edit']); }

  async clone(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ 
      title: 'Clone Group Section', 
      message: `Create a new section based on "${this.group?.name}"? You can modify the schedule and other details after creation.`, 
      confirmText: 'Yes, Clone', 
      cancelText: 'Cancel', 
      type: 'info' 
    });
    
    if (!confirmed) return;

    // Create a clone with modified data
    const cloneData = {
      ...this.group,
      name: `${this.group.name} (Copy)`,
      code: `${this.group.code}-COPY-${Date.now().toString().slice(-4)}`,
      students: [], // Start with no students
      currentEnrollment: 0,
      // Keep the same course (which includes teacher and subject)
      course: this.group.course?._id || this.group.course
    };

    // Remove fields that shouldn't be copied
    delete cloneData._id;
    delete cloneData.id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.classMonitor;
    delete cloneData.createdBy;
    delete cloneData.teacher;  // Remove as it's inherited from course
    delete cloneData.subject;  // Remove as it's inherited from course

    this.groupService.createGroup(cloneData).subscribe({
      next: (response) => {
        const newGroupId = response.data?._id || response.data?.group?._id;
        if (newGroupId) {
          this.router.navigate(['/dashboard/groups', newGroupId, 'edit']);
        } else {
          this.router.navigate(['/dashboard/groups']);
        }
      },
      error: (error) => {
        console.error('Failed to clone group:', error);
        this.toastService.showApiError(error);
      }
    });
  }

  async delete(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Delete Group', message: `Delete ${this.group?.name}?`, confirmText: 'Yes, Delete', cancelText: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    this.groupService.deleteGroup(this.group?.id || this.group?._id).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }

  getDayColorClass(day: string): string {
    const dayLower = day.toLowerCase();
    const colorMap: {[key: string]: string} = {
      'sunday': 'bg-purple-100 text-purple-800 border-purple-300',
      'monday': 'bg-blue-100 text-blue-800 border-blue-300',
      'tuesday': 'bg-green-100 text-green-800 border-green-300',
      'wednesday': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'thursday': 'bg-orange-100 text-orange-800 border-orange-300',
      'friday': 'bg-red-100 text-red-800 border-red-300',
      'saturday': 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colorMap[dayLower] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  getTotalWeeklyHours(): number {
    if (!this.group?.schedule || this.group.schedule.length === 0) return 0;
    
    let totalMinutes = 0;
    for (const slot of this.group.schedule) {
      const start = this.timeToMinutes(slot.startTime);
      const end = this.timeToMinutes(slot.endTime);
      totalMinutes += (end - start);
    }
    
    return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  }

  private timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  }
}


