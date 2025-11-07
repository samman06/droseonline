import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <a routerLink="/attendance" class="hover:text-purple-600 transition-colors">{{ 'attendance.title' | translate }}</a>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900 font-medium">{{ 'common.details' | translate }}</span>
        </nav>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p class="mt-4 text-gray-600 font-medium">{{ 'attendance.loadingDetails' | translate }}</p>
          </div>
        </div>

        <!-- Content -->
        <div *ngIf="!isLoading && attendance">
          <!-- Hero Section with Gradient -->
          <div class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
            <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
            <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            
            <div class="relative z-10">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      {{ attendance.code || 'N/A' }}
                    </span>
                    <span *ngIf="attendance.isCompleted" 
                          class="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      ✓ {{ 'attendance.completed' | translate }}
                    </span>
                    <span *ngIf="!attendance.isCompleted" 
                          class="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      ⏱ {{ 'attendance.incomplete' | translate }}
                    </span>
                    <span *ngIf="attendance.isLocked" 
                          class="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      🔒 {{ 'attendance.locked' | translate }}
                    </span>
                  </div>
                  <h1 class="text-4xl font-bold text-white mb-2">{{ attendance.group?.name || 'N/A' }}</h1>
                  <p class="text-purple-100 text-lg">{{ formatDate(attendance.session.date) }}</p>
                  <div class="flex flex-wrap gap-4 mt-4 text-sm text-purple-100">
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span>{{ attendance.teacher?.fullName || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                      <span>{{ attendance.subject?.name || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      <span>{{ 'attendance.grade' | translate }}: {{ attendance.group?.gradeLevel || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <button 
                    *ngIf="!attendance.isLocked && canEdit"
                    [routerLink]="['/attendance', attendance._id, 'edit']"
                    class="px-6 py-3 bg-white text-purple-600 font-medium rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    {{ 'attendance.editAttendance' | translate }}
                  </button>
                  <button 
                    *ngIf="!attendance.isLocked && canLock"
                    (click)="lockAttendance()"
                    class="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                    </svg>
                    {{ 'attendance.lockSession' | translate }}
                  </button>
                  <button 
                    *ngIf="attendance.isLocked && isAdmin"
                    (click)="unlockAttendance()"
                    class="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                    </svg>
                    {{ 'attendance.unlockSession' | translate }}
                  </button>
                  <button 
                    (click)="exportReport()"
                    class="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {{ 'common.export' | translate }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">{{ 'attendance.present' | translate }}</p>
                  <p class="text-3xl font-bold text-green-600 mt-2">{{ attendance.stats?.present || 0 }}</p>
                  <div class="mt-2 flex items-center">
                    <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full" 
                           [style.width.%]="calculatePercentage(attendance.stats?.present || 0, attendance.stats?.total || 1)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-green-100 rounded-full p-3">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">{{ 'attendance.absent' | translate }}</p>
                  <p class="text-3xl font-bold text-red-600 mt-2">{{ attendance.stats?.absent || 0 }}</p>
                  <div class="mt-2 flex items-center">
                    <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-red-500 rounded-full" 
                           [style.width.%]="calculatePercentage(attendance.stats?.absent || 0, attendance.stats?.total || 1)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-red-100 rounded-full p-3">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">{{ 'attendance.late' | translate }}</p>
                  <p class="text-3xl font-bold text-yellow-600 mt-2">{{ attendance.stats?.late || 0 }}</p>
                  <div class="mt-2 flex items-center">
                    <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-yellow-500 rounded-full" 
                           [style.width.%]="calculatePercentage(attendance.stats?.late || 0, attendance.stats?.total || 1)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-yellow-100 rounded-full p-3">
                  <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">{{ 'attendance.excused' | translate }}</p>
                  <p class="text-3xl font-bold text-blue-600 mt-2">{{ attendance.stats?.excused || 0 }}</p>
                  <div class="mt-2 flex items-center">
                    <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" 
                           [style.width.%]="calculatePercentage(attendance.stats?.excused || 0, attendance.stats?.total || 1)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-blue-100 rounded-full p-3">
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div *ngIf="attendance.sessionRevenue && attendance.sessionRevenue > 0" class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">{{ 'attendance.revenue' | translate }}</p>
                  <p class="text-3xl font-bold text-emerald-600 mt-2">{{ attendance.sessionRevenue }}</p>
                  <p class="text-xs text-gray-500 mt-2">{{ attendance.presentCount || 0 }} × {{ attendance.pricePerSession || 0 }} EGP</p>
                </div>
                <div class="bg-emerald-100 rounded-full p-3">
                  <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Rate Card -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4">{{ 'attendance.attendanceRate' | translate }}</h2>
            <div class="flex items-center justify-center py-8">
              <div class="relative inline-flex items-center justify-center">
                <svg class="transform -rotate-90 w-40 h-40">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="12" fill="transparent" class="text-gray-200"/>
                  <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="12" fill="transparent" 
                          [attr.stroke-dasharray]="2 * 3.14159 * 70"
                          [attr.stroke-dashoffset]="2 * 3.14159 * 70 * (1 - (attendance.stats?.rate || 0) / 100)"
                          [ngClass]="{
                            'text-green-500': (attendance.stats?.rate || 0) >= 80,
                            'text-yellow-500': (attendance.stats?.rate || 0) >= 60 && (attendance.stats?.rate || 0) < 80,
                            'text-red-500': (attendance.stats?.rate || 0) < 60
                          }"
                          class="transition-all duration-1000"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-4xl font-bold" 
                        [ngClass]="{
                          'text-green-600': (attendance.stats?.rate || 0) >= 80,
                          'text-yellow-600': (attendance.stats?.rate || 0) >= 60 && (attendance.stats?.rate || 0) < 80,
                          'text-red-600': (attendance.stats?.rate || 0) < 60
                        }">
                    {{ attendance.stats?.rate || 0 }}%
                  </span>
                  <span class="text-sm text-gray-600 mt-1">{{ 'attendance.title' | translate }}</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">{{ attendance.stats?.total || 0 }}</p>
                <p class="text-sm text-gray-600">{{ 'attendance.totalStudents' | translate }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">{{ (attendance.stats?.present || 0) + (attendance.stats?.late || 0) }}</p>
                <p class="text-sm text-gray-600">{{ 'attendance.attended' | translate }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-red-600">{{ attendance.stats?.absent || 0 }}</p>
                <p class="text-sm text-gray-600">{{ 'attendance.missed' | translate }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-purple-600">{{ attendance.stats?.rate || 0 }}%</p>
                <p class="text-sm text-gray-600">{{ 'attendance.successRate' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Session Information Card -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-8" *ngIf="attendance.sessionNotes">
            <h2 class="text-xl font-bold text-gray-900 mb-4">{{ 'attendance.sessionNotes' | translate }}</h2>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p class="text-gray-700 whitespace-pre-wrap">{{ attendance.sessionNotes }}</p>
            </div>
          </div>

          <!-- Student List Table -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <h2 class="text-xl font-bold text-gray-900">{{ 'attendance.studentAttendanceRecords' | translate }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ 'attendance.detailedBreakdown' | translate }}</p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'common.student' | translate }}</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'attendance.status' | translate }}</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'attendance.lateBy' | translate }}</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'common.notes' | translate }}</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'attendance.markedBy' | translate }}</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{{ 'attendance.markedAt' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let record of attendance.records" class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span class="text-purple-600 font-semibold">{{ getInitials(record.student?.fullName || 'N/A') }}</span>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">{{ record.student?.fullName || 'N/A' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                            [ngClass]="{
                              'bg-green-100 text-green-800': record.status === 'present',
                              'bg-red-100 text-red-800': record.status === 'absent',
                              'bg-yellow-100 text-yellow-800': record.status === 'late',
                              'bg-blue-100 text-blue-800': record.status === 'excused'
                            }">
                        {{ record.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ record.status === 'late' ? (record.minutesLate || 0) + ' min' : '-' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <div class="max-w-xs truncate" [title]="record.notes || '-'">
                        {{ record.notes || '-' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ record.markedBy?.fullName || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ formatDateTime(record.markedAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Meta Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ 'attendance.sessionInformation' | translate }}</h3>
              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.sessionDate' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ formatDate(attendance.session.date) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.completed' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ attendance.isCompleted ? ('common.yes' | translate) : ('common.no' | translate) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.locked' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ attendance.isLocked ? ('common.yes' | translate) : ('common.no' | translate) }}</dd>
                </div>
                <div *ngIf="attendance.isLocked" class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.lockedBy' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ attendance.lockedBy?.fullName || 'N/A' }}</dd>
                </div>
                <div *ngIf="attendance.isLocked" class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.lockedAt' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ formatDateTime(attendance.lockedAt) }}</dd>
                </div>
              </dl>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ 'attendance.recordInformation' | translate }}</h3>
              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'common.createdBy' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ attendance.createdBy?.fullName || 'N/A' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'common.createdAt' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ formatDateTime(attendance.createdAt) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'common.lastUpdated' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ formatDateTime(attendance.updatedAt) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-600">{{ 'attendance.totalRecords' | translate }}:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ attendance.records.length || 0 }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Back Button -->
          <div class="mt-8 flex justify-center">
            <button 
              (click)="goBack()"
              class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              {{ 'attendance.backToList' | translate }}
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="!isLoading && !attendance" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ 'attendance.notFound' | translate }}</h2>
          <p class="text-gray-600 mb-6">{{ 'attendance.notFoundMessage' | translate }}</p>
          <button 
            (click)="goBack()"
            class="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            {{ 'attendance.returnToList' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AttendanceDetailComponent implements OnInit {
  attendance: Attendance | null = null;
  isLoading = true;
  canEdit = false;
  canLock = false;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAttendance(id);
    } else {
      this.isLoading = false;
      this.toastService.error(this.translate.instant('attendance.noIdProvided'));
      this.router.navigate(['/attendance']);
    }

    // Check permissions
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.isAdmin = currentUser.role === 'admin';
      this.canEdit = this.isAdmin || currentUser.role === 'teacher';
      this.canLock = this.canEdit;
    }
  }

  loadAttendance(id: string) {
    this.isLoading = true;
    this.attendanceService.getAttendance(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendance = response.data.attendance;
        } else {
          this.toastService.error(this.translate.instant('attendance.failedToLoadDetails'));
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadDetails'));
        this.isLoading = false;
      }
    });
  }

  lockAttendance() {
    if (!this.attendance?._id) return;

    this.confirmationService.confirm({
      title: this.translate.instant('attendance.lockSessionTitle'),
      message: this.translate.instant('attendance.lockSessionMessage'),
      confirmText: this.translate.instant('attendance.lock'),
      cancelText: this.translate.instant('common.cancel'),
      type: 'warning'
    }).then((confirmed) => {
      if (confirmed) {
        this.attendanceService.lockAttendance(this.attendance!._id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success(this.translate.instant('attendance.sessionLockedSuccessfully'));
              this.loadAttendance(this.attendance!._id!);
            }
          },
          error: (error) => {
            console.error('Error locking attendance:', error);
            this.toastService.error(this.translate.instant('attendance.failedToLock'));
          }
        });
      }
    });
  }

  unlockAttendance() {
    if (!this.attendance?._id) return;

    this.confirmationService.confirm({
      title: this.translate.instant('attendance.unlockSessionTitle'),
      message: this.translate.instant('attendance.unlockSessionMessage'),
      confirmText: this.translate.instant('attendance.unlock'),
      cancelText: this.translate.instant('common.cancel'),
      type: 'warning'
    }).then((confirmed) => {
      if (confirmed) {
        this.attendanceService.unlockAttendance(this.attendance!._id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success(this.translate.instant('attendance.sessionUnlockedSuccessfully'));
              this.loadAttendance(this.attendance!._id!);
            }
          },
          error: (error) => {
            console.error('Error unlocking attendance:', error);
            this.toastService.error(this.translate.instant('attendance.failedToUnlock'));
          }
        });
      }
    });
  }

  exportReport() {
    if (!this.attendance?.group?._id) return;

    const params = {
      groupId: this.attendance.group._id,
      dateFrom: this.formatDateForAPI(this.attendance.session.date),
      dateTo: this.formatDateForAPI(this.attendance.session.date),
      format: 'csv' as const
    };

    this.attendanceService.exportAttendance(params).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${this.attendance?.code || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success(this.translate.instant('attendance.reportExported'));
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.toastService.error(this.translate.instant('attendance.failedToExportReport'));
      }
    });
  }

  calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateForAPI(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  goBack() {
    this.router.navigate(['/attendance']);
  }
}
