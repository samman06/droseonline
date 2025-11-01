import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StudentService } from '../../services/student.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

interface Student {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  academicInfo: {
    studentId: string;
    currentGrade: string;
    enrollmentDate: Date;
    groups: any[];
  };
  createdAt: Date;
}

@Component({
  selector: 'app-teacher-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-4xl font-bold text-white">{{ 'teacherStudents.title' | translate }}</h1>
              <p class="mt-2 text-purple-100 text-lg">{{ 'teacherStudents.subtitle' | translate }}</p>
              <div class="mt-3 flex items-center space-x-4">
                <span class="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/30">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  {{ pagination.total }} {{ (pagination.total === 1 ? 'teacherStudents.student' : 'teacherStudents.studentPlural') | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <!-- View Toggle -->
            <div class="inline-flex bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
              <button 
                (click)="setViewMode('card')"
                [class]="viewMode === 'card' 
                  ? 'px-4 py-2 bg-white text-purple-600 rounded-lg shadow-md font-medium transition-all' 
                  : 'px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all'"
                [title]="'teacherStudents.cardView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
              <button 
                (click)="setViewMode('table')"
                [class]="viewMode === 'table' 
                  ? 'px-4 py-2 bg-white text-purple-600 rounded-lg shadow-md font-medium transition-all' 
                  : 'px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all'"
                [title]="'teacherStudents.tableView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
            <button 
              (click)="exportStudents()" 
              class="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30 inline-flex items-center shadow-lg"
              [disabled]="students.length === 0"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {{ 'teacherStudents.exportList' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            {{ 'teacherStudents.filterStudents' | translate }}
          </h3>
          <button 
            *ngIf="hasActiveFilters()" 
            (click)="clearFilters()" 
            class="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            {{ 'teacherStudents.clearAll' | translate }}
          </button>
        </div>

        <!-- Active Filters Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-4">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            "{{ filters.search }}"
            <button (click)="removeFilter('search')" class="ml-2 text-purple-600 hover:text-purple-800 font-bold">×</button>
          </span>
          <span *ngIf="filters.grade" class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            {{ filters.grade }}
            <button (click)="removeFilter('grade')" class="ml-2 text-blue-600 hover:text-blue-800 font-bold">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Search by Name/Email -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input 
              type="text" 
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              [placeholder]="'teacherStudents.searchPlaceholder' | translate"
            >
          </div>
          
          <!-- Grade Filter -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <select 
              [(ngModel)]="filters.grade"
              (ngModelChange)="onFiltersChange()"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none transition-all"
            >
              <option value="">{{ 'teacherStudents.allGradeLevels' | translate }}</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Students Cards/Grid -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-16">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ 'teacherStudents.loadingStudents' | translate }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && students.length === 0" class="text-center py-16 px-4">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ 'teacherStudents.noStudentsFound' | translate }}</h3>
          <p class="text-gray-500 mb-6">
            <span *ngIf="hasActiveFilters()">{{ 'teacherStudents.adjustFilters' | translate }}</span>
            <span *ngIf="!hasActiveFilters()">{{ 'teacherStudents.noStudentsYet' | translate }}</span>
          </p>
        </div>

        <!-- Card View -->
        <div *ngIf="!isLoading && students.length > 0 && viewMode === 'card'" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let student of students; trackBy: trackByStudentId" 
                 class="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-200 cursor-pointer"
                 (click)="viewStudent(student)">
              <!-- Student Avatar -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-14 h-14 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-bold text-gray-900">{{ student.fullName }}</h3>
                    <p class="text-sm text-gray-500">{{ student.academicInfo.studentId }}</p>
                  </div>
                </div>
                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {{ student.academicInfo.currentGrade }}
                </span>
              </div>

              <!-- Student Info -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ student.email }}
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  {{ student.academicInfo.groups.length || 0 }} {{ 'teacherStudents.groupsCount' | translate }}
                </div>
              </div>

              <!-- View Details Button -->
              <button 
                (click)="viewStudent(student); $event.stopPropagation()"
                class="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                {{ 'teacherStudents.viewDetails' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div *ngIf="!isLoading && students.length > 0 && viewMode === 'table'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'teacherStudents.student' | translate }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'teacherStudents.studentId' | translate }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'teacherStudents.grade' | translate }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'students.email' | translate }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'teacherStudents.groupsCount' | translate }}
                </th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {{ 'students.actions' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let student of students; trackBy: trackByStudentId" 
                  class="hover:bg-purple-50 transition-colors cursor-pointer"
                  (click)="viewStudent(student)">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                      <div class="h-12 w-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-semibold text-gray-900">
                        {{ student.fullName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 font-medium">{{ student.academicInfo.studentId }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ student.academicInfo.currentGrade }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ student.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {{ student.academicInfo.groups.length || 0 }} {{ 'teacherStudents.groupsCount' | translate }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    (click)="viewStudent(student); $event.stopPropagation()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
                  >
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    {{ 'teacherStudents.view' | translate }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (for both views) -->
        <div *ngIf="!isLoading && students.length > 0" class="p-6">
          <div *ngIf="pagination.pages > 1" class="flex items-center justify-between border-t border-gray-200 pt-6">
            <div class="text-sm text-gray-700">
              {{ 'teacherStudents.showing' | translate }} <span class="font-semibold">{{ (pagination.page - 1) * pagination.limit + 1 }}</span> {{ 'teacherStudents.to' | translate }}
              <span class="font-semibold">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span> {{ 'teacherStudents.of' | translate }}
              <span class="font-semibold">{{ pagination.total }}</span> {{ (pagination.total === 1 ? 'teacherStudents.student' : 'teacherStudents.studentPlural') | translate }}
            </div>
            <div class="flex gap-2">
              <button 
                (click)="changePage(pagination.page - 1)"
                [disabled]="pagination.page <= 1"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <div class="flex gap-1">
                <button 
                  *ngFor="let page of getVisiblePages()"
                  (click)="changePage(page)"
                  [class]="page === pagination.page 
                    ? 'px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-md' 
                    : 'px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all'"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                (click)="changePage(pagination.page + 1)"
                [disabled]="pagination.page >= pagination.pages"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TeacherStudentsListComponent implements OnInit {
  students: Student[] = [];
  isLoading = false;
  currentUser: any;
  viewMode: 'card' | 'table' = 'card';
  
  filters = {
    search: '',
    grade: ''
  };
  
  pagination = {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  };

  Math = Math;
  private searchDebounce: any;

  constructor(
    private studentService: StudentService,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.currentUser = this.authService.currentUser;
    // Load saved view preference
    const savedView = localStorage.getItem('teacherStudentViewMode');
    if (savedView === 'card' || savedView === 'table') {
      this.viewMode = savedView;
    }
  }

  ngOnInit(): void {
    if (this.currentUser?.role !== 'teacher') {
      this.toastService.error(this.translate.instant('teacherStudents.accessDenied'));
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.grade) params.grade = this.filters.grade;

    this.studentService.getStudents(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.students = response.data.students || [];
          this.pagination = response.data.pagination || this.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.toastService.error(this.translate.instant('teacherStudents.failedToLoad'));
        this.isLoading = false;
      }
    });
  }

  viewStudent(student: Student): void {
    this.router.navigate(['/dashboard/students', student._id || student.id]);
  }

  setViewMode(mode: 'card' | 'table'): void {
    this.viewMode = mode;
    localStorage.setItem('teacherStudentViewMode', mode);
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadStudents();
  }

  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.pagination.page = 1;
      this.loadStudents();
    }, 300);
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      grade: ''
    };
    this.pagination.page = 1;
    this.loadStudents();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.grade);
  }

  removeFilter(key: 'search' | 'grade'): void {
    (this.filters as any)[key] = '';
    this.pagination.page = 1;
    this.loadStudents();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadStudents();
  }

  getVisiblePages(): number[] {
    const currentPage = this.pagination.page;
    const totalPages = this.pagination.pages;
    const visiblePages: number[] = [];
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    
    return visiblePages;
  }

  trackByStudentId(index: number, student: Student): string {
    return student._id || student.id;
  }

  exportStudents(): void {
    if (this.students.length === 0) return;
    
    const headers = ['Student ID', 'Name', 'Email', 'Grade', 'Groups'];
    const csvContent = [
      headers.join(','),
      ...this.students.map(student => [
        student.academicInfo.studentId,
        `"${student.fullName}"`,
        student.email,
        student.academicInfo.currentGrade,
        student.academicInfo.groups.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.toastService.success(this.translate.instant('teacherStudents.exportSuccess'));
  }
}

