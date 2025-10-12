import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-indigo-600">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Attendance Details</h1>
              <p class="text-gray-600" *ngIf="attendance">{{ attendance.group?.name }} - {{ attendance.session.date | date:'fullDate' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Lock Status -->
              <span 
                *ngIf="attendance && attendance.isLocked"
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-red-100 text-red-800"
              >
                <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                Locked
              </span>
              <button 
                (click)="goBack()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p class="mt-4 text-gray-600">Loading attendance details...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ error }}</p>
          </div>
        </div>

        <div *ngIf="!isLoading && !error && attendance">
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <!-- Present Card -->
            <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500 transform hover:scale-105 transition-all duration-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Present</p>
                  <p class="text-3xl font-bold text-green-600">{{ attendance.stats?.present || 0 }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getPercentage('present') }}%</p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Late Card -->
            <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500 transform hover:scale-105 transition-all duration-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Late</p>
                  <p class="text-3xl font-bold text-yellow-600">{{ attendance.stats?.late || 0 }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getPercentage('late') }}%</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-full">
                  <svg class="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Absent Card -->
            <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500 transform hover:scale-105 transition-all duration-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Absent</p>
                  <p class="text-3xl font-bold text-red-600">{{ attendance.stats?.absent || 0 }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getPercentage('absent') }}%</p>
                </div>
                <div class="p-3 bg-red-100 rounded-full">
                  <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Excused Card -->
            <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500 transform hover:scale-105 transition-all duration-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Excused</p>
                  <p class="text-3xl font-bold text-blue-600">{{ attendance.stats?.excused || 0 }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getPercentage('excused') }}%</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Rate Card -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 mb-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold mb-2">Overall Attendance Rate</h2>
                <p class="text-indigo-100">{{ attendance.session.date | date:'fullDate' }}</p>
              </div>
              <div class="text-center">
                <div class="text-6xl font-bold">{{ attendance.stats?.rate || 0 }}%</div>
                <div class="text-sm text-indigo-100 mt-2">
                  {{ attendance.stats?.present + attendance.stats?.late || 0 }} / {{ attendance.stats?.total || 0 }} students
                </div>
              </div>
            </div>
            <!-- Progress Bar -->
            <div class="mt-6 bg-indigo-800 bg-opacity-30 rounded-full h-4 overflow-hidden">
              <div 
                class="bg-white h-full rounded-full transition-all duration-500"
                [style.width.%]="attendance.stats?.rate || 0"
              ></div>
            </div>
          </div>

          <!-- Session Information and Quick Actions -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Session Info -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Group</p>
                    <p class="font-semibold text-gray-900">{{ attendance.group?.name }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Teacher</p>
                    <p class="font-semibold text-gray-900">{{ attendance.teacher?.fullName }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Subject</p>
                    <p class="font-semibold text-gray-900">{{ attendance.subject?.name }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Date</p>
                    <p class="font-semibold text-gray-900">{{ attendance.session.date | date:'medium' }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Completion</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          [class]="attendance.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                      {{ attendance.isCompleted ? 'Completed' : 'Incomplete' }}
                    </span>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600">Lock Status</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="attendance.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'">
                      {{ attendance.isLocked ? 'Locked' : 'Unlocked' }}
                    </span>
                  </div>
                </div>
              </div>
              <div *ngIf="attendance.sessionNotes" class="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p class="text-sm font-medium text-indigo-900 mb-1">Session Notes:</p>
                <p class="text-sm text-gray-700">{{ attendance.sessionNotes }}</p>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button 
                  [routerLink]="['/dashboard/attendance/edit', attendanceId]"
                  class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Attendance
                </button>
                <button 
                  (click)="exportSession()"
                  class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Export to CSV
                </button>
                <button 
                  *ngIf="!attendance.isLocked && canLock"
                  (click)="lockSession()"
                  class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                  </svg>
                  Lock Session
                </button>
                <button 
                  *ngIf="attendance.isLocked && isAdmin"
                  (click)="unlockSession()"
                  class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                  </svg>
                  Unlock Session
                </button>
                <button 
                  (click)="deleteSession()"
                  class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete Session
                </button>
              </div>
            </div>
          </div>

          <!-- Student Attendance Records -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
              <h3 class="text-lg font-semibold text-white">Student Attendance Records</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes Late</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked At</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let record of attendance.records; let i = index" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ i + 1 }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ record.student?.fullName }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ record.student?.academicInfo?.studentId || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                            [ngClass]="{
                              'bg-green-100 text-green-800': record.status === 'present',
                              'bg-yellow-100 text-yellow-800': record.status === 'late',
                              'bg-red-100 text-red-800': record.status === 'absent',
                              'bg-blue-100 text-blue-800': record.status === 'excused'
                            }">
                        {{ record.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ record.status === 'late' ? (record.minutesLate || 0) + ' min' : '-' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {{ record.notes || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ record.markedAt | date:'short' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceDetailComponent implements OnInit {
  attendanceId: string = '';
  attendance: any = null;
  
  isLoading = false;
  error: string = '';
  isAdmin: boolean = false;
  canLock: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.attendanceId = this.route.snapshot.paramMap.get('id') || '';
    const currentUser = this.authService.currentUser;
    this.isAdmin = currentUser?.role === 'admin';
    this.canLock = this.isAdmin || currentUser?.role === 'teacher';
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.error = '';

    this.attendanceService.getAttendance(this.attendanceId).subscribe({
      next: (response) => {
        this.attendance = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load attendance details';
        this.isLoading = false;
      }
    });
  }

  getPercentage(status: string): number {
    if (!this.attendance || !this.attendance.stats || this.attendance.stats.total === 0) {
      return 0;
    }
    const count = this.attendance.stats[status] || 0;
    return Math.round((count / this.attendance.stats.total) * 100);
  }

  exportSession(): void {
    const groupId = this.attendance.group?._id || this.attendance.group;
    const date = new Date(this.attendance.session.date);
    const dateStr = date.toISOString().split('T')[0];

    this.attendanceService.exportAttendance({
      groupId: groupId,
      dateFrom: dateStr,
      dateTo: dateStr,
      format: 'csv'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-${this.attendance.group?.name}-${dateStr}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to export attendance';
      }
    });
  }

  async lockSession(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Lock Session',
      message: 'Are you sure you want to lock this session? You will not be able to edit it later.',
      confirmText: 'Lock',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    this.attendanceService.lockAttendance(this.attendanceId).subscribe({
      next: () => {
        this.loadAttendance();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to lock session';
      }
    });
  }

  async unlockSession(): Promise<void> {
    if (!this.isAdmin) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Unlock Session',
      message: 'Are you sure you want to unlock this session? This will allow edits again.',
      confirmText: 'Unlock',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    this.attendanceService.unlockAttendance(this.attendanceId).subscribe({
      next: () => {
        this.loadAttendance();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to unlock session';
      }
    });
  }

  async deleteSession(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Session',
      message: 'Are you sure you want to delete this attendance session? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    this.attendanceService.deleteAttendance(this.attendanceId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/attendance']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete session';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/attendance']);
  }
}