import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { GroupService } from '../../services/group.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Gradient Header Section -->
        <div class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
          <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
          
          <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">📋 Attendance Management</h1>
              <p class="text-purple-100 text-lg">Track and manage student attendance sessions</p>
            </div>
            <div class="flex gap-3">
              <button 
                (click)="exportData()"
                class="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export
              </button>
              <button 
                (click)="showPendingGroups()"
                class="px-6 py-3 bg-white text-purple-600 font-medium rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pending Today
                <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">{{ pendingCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Total Sessions</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalSessions || 0 }}</p>
              </div>
              <div class="bg-purple-100 rounded-full p-3">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Overall Rate</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.overallRate || 0 }}%</p>
              </div>
              <div class="bg-green-100 rounded-full p-3">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Completed</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.completedSessions || 0 }}</p>
              </div>
              <div class="bg-blue-100 rounded-full p-3">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Pending</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.pendingSessions || 0 }}</p>
              </div>
              <div class="bg-orange-100 rounded-full p-3">
                <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Filters & Search</h2>
            <button 
              *ngIf="hasActiveFilters()"
              (click)="clearAllFilters()"
              class="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>

          <!-- Search Bar -->
          <div class="mb-4">
            <div class="relative">
              <input 
                type="text"
                [(ngModel)]="filters.search"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search by code or session notes..."
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg class="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <!-- Filter Dropdowns -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select 
                [(ngModel)]="filters.groupId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Groups</option>
                <option *ngFor="let group of groups" [value]="group._id">{{ group.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
              <select 
                [(ngModel)]="filters.teacherId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Teachers</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">{{ teacher.fullName }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                [(ngModel)]="filters.subjectId"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                <option *ngFor="let subject of subjects" [value]="subject._id">{{ subject.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                [(ngModel)]="filters.isCompleted"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">View</label>
              <select 
                [(ngModel)]="viewMode"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="table">Table View</option>
                <option value="cards">Card View</option>
              </select>
            </div>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input 
                type="date"
                [(ngModel)]="filters.dateFrom"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input 
                type="date"
                [(ngModel)]="filters.dateTo"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Filter Chips -->
          <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Search: "{{ filters.search }}"
              <button (click)="removeFilter('search')" class="ml-2 hover:text-purple-900">×</button>
            </span>
            <span *ngIf="filters.groupId" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Group
              <button (click)="removeFilter('groupId')" class="ml-2 hover:text-blue-900">×</button>
            </span>
            <span *ngIf="filters.teacherId" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Teacher
              <button (click)="removeFilter('teacherId')" class="ml-2 hover:text-green-900">×</button>
            </span>
            <span *ngIf="filters.subjectId" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              Subject
              <button (click)="removeFilter('subjectId')" class="ml-2 hover:text-yellow-900">×</button>
            </span>
            <span *ngIf="filters.isCompleted" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
              Status: {{ filters.isCompleted === 'true' ? 'Completed' : 'Incomplete' }}
              <button (click)="removeFilter('isCompleted')" class="ml-2 hover:text-indigo-900">×</button>
            </span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <!-- Attendance List - Table View -->
        <div *ngIf="!loading && viewMode === 'table'" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Group</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Session Date</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Teacher</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stats</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let attendance of attendances" class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-purple-600">{{ attendance.code || 'N/A' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ attendance.group?.name || 'N/A' }}</div>
                    <div class="text-xs text-gray-500">{{ attendance.group?.gradeLevel || '' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(attendance.session.date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ attendance.teacher?.fullName || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ attendance.subject?.name || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="text-xs">
                        <span class="text-green-600 font-medium">{{ attendance.stats?.present || 0 }}</span>
                        /
                        <span class="text-gray-600">{{ attendance.stats?.total || 0 }}</span>
                      </div>
                      <div class="text-xs font-medium" 
                           [ngClass]="{
                             'text-green-600': (attendance.stats?.rate || 0) >= 80,
                             'text-yellow-600': (attendance.stats?.rate || 0) >= 60 && (attendance.stats?.rate || 0) < 80,
                             'text-red-600': (attendance.stats?.rate || 0) < 60
                           }">
                        ({{ attendance.stats?.rate || 0 }}%)
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span *ngIf="attendance.isCompleted" 
                          class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                    <span *ngIf="!attendance.isCompleted" 
                          class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Incomplete
                    </span>
                    <span *ngIf="attendance.isLocked" 
                          class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 ml-1">
                      🔒 Locked
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button 
                        [routerLink]="['/attendance', attendance._id]"
                        class="text-purple-600 hover:text-purple-900"
                        title="View Details"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      <button 
                        *ngIf="!attendance.isLocked"
                        [routerLink]="['/attendance', attendance._id, 'edit']"
                        class="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button 
                        (click)="deleteAttendance(attendance._id!)"
                        class="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div *ngIf="attendances.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="mt-2 text-sm text-gray-500">No attendance records found</p>
            <p class="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        </div>

        <!-- Attendance List - Card View -->
        <div *ngIf="!loading && viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let attendance of attendances" 
               class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200">
            <div class="p-6">
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div>
                  <div class="text-sm font-semibold text-purple-600 mb-1">{{ attendance.code || 'N/A' }}</div>
                  <h3 class="text-lg font-bold text-gray-900">{{ attendance.group?.name || 'N/A' }}</h3>
                  <p class="text-sm text-gray-500">{{ attendance.group?.gradeLevel || '' }}</p>
                </div>
                <div class="flex flex-col gap-1">
                  <span *ngIf="attendance.isCompleted" 
                        class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 text-center">
                    ✓ Complete
                  </span>
                  <span *ngIf="!attendance.isCompleted" 
                        class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 text-center">
                    ⏱ Pending
                  </span>
                  <span *ngIf="attendance.isLocked" 
                        class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 text-center">
                    🔒 Locked
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatDate(attendance.session.date) }}
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  {{ attendance.teacher?.fullName || 'N/A' }}
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  {{ attendance.subject?.name || 'N/A' }}
                </div>
              </div>

              <!-- Stats -->
              <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 mb-4">
                <div class="flex items-center justify-between">
                  <div class="text-center flex-1">
                    <div class="text-2xl font-bold text-green-600">{{ attendance.stats?.present || 0 }}</div>
                    <div class="text-xs text-gray-600">Present</div>
                  </div>
                  <div class="text-center flex-1 border-l border-gray-300">
                    <div class="text-2xl font-bold text-red-600">{{ attendance.stats?.absent || 0 }}</div>
                    <div class="text-xs text-gray-600">Absent</div>
                  </div>
                  <div class="text-center flex-1 border-l border-gray-300">
                    <div class="text-2xl font-bold text-gray-900">{{ attendance.stats?.rate || 0 }}%</div>
                    <div class="text-xs text-gray-600">Rate</div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button 
                  [routerLink]="['/attendance', attendance._id]"
                  class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                >
                  View Details
                </button>
                <button 
                  *ngIf="!attendance.isLocked"
                  [routerLink]="['/attendance', attendance._id, 'edit']"
                  class="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button 
                  (click)="deleteAttendance(attendance._id!)"
                  class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State for Cards -->
          <div *ngIf="attendances.length === 0" class="col-span-full text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="mt-2 text-sm text-gray-500">No attendance records found</p>
            <p class="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading && attendances.length > 0" class="mt-6 flex items-center justify-between bg-white rounded-xl shadow-lg px-6 py-4">
          <div class="text-sm text-gray-700">
            Showing <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span> to 
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span> of 
            <span class="font-medium">{{ pagination.total }}</span> results
          </div>
          <div class="flex gap-2">
            <button 
              [disabled]="pagination.page === 1"
              (click)="changePage(pagination.page - 1)"
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="px-4 py-2 text-sm text-gray-700">
              Page {{ pagination.page }} of {{ pagination.pages }}
            </span>
            <button 
              [disabled]="pagination.page >= pagination.pages"
              (click)="changePage(pagination.page + 1)"
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceListComponent implements OnInit {
  attendances: Attendance[] = [];
  groups: any[] = [];
  teachers: any[] = [];
  subjects: any[] = [];
  loading = false;
  viewMode: 'table' | 'cards' = 'table';
  pendingCount = 0;

  filters = {
    search: '',
    groupId: '',
    teacherId: '',
    subjectId: '',
    isCompleted: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  };

  pagination = {
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  };

  stats = {
    totalSessions: 0,
    overallRate: 0,
    completedSessions: 0,
    pendingSessions: 0
  };

  Math = Math;
  private searchTimeout: any;

  constructor(
    private attendanceService: AttendanceService,
    private groupService: GroupService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadAttendances();
    this.loadGroups();
    this.loadTeachers();
    this.loadSubjects();
    this.loadStats();
    this.loadPendingCount();
  }

  loadAttendances() {
    this.loading = true;
    const params = { ...this.filters };
    
    this.attendanceService.getAttendances(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendances = response.data.attendances;
          this.pagination = response.data.pagination;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendances:', error);
        this.toastService.error('Failed to load attendance records');
        this.loading = false;
      }
    });
  }

  loadGroups() {
    this.groupService.getGroups({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.groups = response.success ? response.data.groups : response.groups || [];
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  loadTeachers() {
    this.teacherService.getTeachers({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.teachers = response.success ? response.data.teachers : response.teachers || [];
      },
      error: (error) => console.error('Error loading teachers:', error)
    });
  }

  loadSubjects() {
    this.subjectService.getSubjects({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.subjects = response.success ? response.data.subjects : response.subjects || [];
      },
      error: (error) => console.error('Error loading subjects:', error)
    });
  }

  loadStats() {
    this.attendanceService.getAttendanceStats().subscribe({
      next: (data) => {
        this.stats = {
          totalSessions: data.totalSessions || 0,
          overallRate: data.overallRate || 0,
          completedSessions: data.completedSessions || 0,
          pendingSessions: data.pendingSessions || 0
        };
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  loadPendingCount() {
    this.attendanceService.getPendingAttendance().subscribe({
      next: (response) => {
        this.pendingCount = response.count || 0;
      },
      error: (error) => console.error('Error loading pending count:', error)
    });
  }

  onSearchChange(value: string) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadAttendances();
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadAttendances();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.groupId ||
      this.filters.teacherId ||
      this.filters.subjectId ||
      this.filters.isCompleted ||
      this.filters.dateFrom ||
      this.filters.dateTo
    );
  }

  removeFilter(filterName: keyof typeof this.filters) {
    (this.filters as any)[filterName] = '';
    this.applyFilters();
  }

  clearAllFilters() {
    this.filters = {
      search: '',
      groupId: '',
      teacherId: '',
      subjectId: '',
      isCompleted: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 10
    };
    this.applyFilters();
  }

  deleteAttendance(id: string) {
    this.confirmationService.confirm({
      title: 'Delete Attendance Record',
      message: 'Are you sure you want to delete this attendance record? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.attendanceService.deleteAttendance(id).subscribe({
          next: () => {
            this.toastService.success('Attendance record deleted successfully');
            this.loadAttendances();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting attendance:', error);
            this.toastService.error('Failed to delete attendance record');
          }
        });
      }
    });
  }

  showPendingGroups() {
    this.router.navigate(['/attendance/pending']);
  }

  exportData() {
    const params = {
      ...this.filters,
      format: 'csv' as const
    };
    
    this.attendanceService.exportAttendance(params).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Attendance data exported successfully');
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        this.toastService.error('Failed to export attendance data');
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
