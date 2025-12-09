import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StudentService } from '../../services/student.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string; // Backend field name
  parentContact?: {
    primaryPhone?: string; // Backend field name
    secondaryPhone?: string;
  };
  academicInfo: {
    studentId: string;
    currentGrade: string;
    enrollmentDate: Date;
    groups: any[];
  };
  attendanceRate?: number; // Percentage (0-100) - scoped by role (admin: all groups, teacher: their groups)
  createdAt: Date;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section with Enhanced Design -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {{ (isAdmin ? 'students.studentsManagement' : 'teacherStudents.title') | translate }}
              </h1>
              <p class="mt-1 text-gray-600">{{ (isAdmin ? 'students.manageStudentRecords' : 'teacherStudents.subtitle') | translate }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  {{ pagination.total }} {{ 'students.total' | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <button 
              (click)="exportStudents()" 
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              [disabled]="students.length === 0"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {{ 'students.exportData' | translate }}
            </button>
            <!-- Admin-only buttons -->
            <button 
              *ngIf="isAdmin"
              (click)="importStudents()"
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
              {{ 'students.import' | translate }}
            </button>
            <button 
              *ngIf="isAdmin"
              (click)="addNewStudent()" 
              class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ 'students.addNewStudent' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Simple Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Filters Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ 'students.filters' | translate }}</h3>
          <button (click)="clearFilters()" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            {{ 'students.clearFilters' | translate }}
          </button>
        </div>

        <!-- Active Filter Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Search: {{ filters.search }}
            <button (click)="removeFilter('search')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.year" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Grade: {{ filters.year }}
            <button (click)="removeFilter('year')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.teacherId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Teacher: {{ getTeacherName(filters.teacherId) }}
            <button (click)="removeFilter('teacherId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.subjectId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Subject: {{ getSubjectName(filters.subjectId) }}
            <button (click)="removeFilter('subjectId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search by Name -->
          <div>
            <input 
              type="text" 
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="🔍 {{ 'students.searchStudents' | translate }}"
            >
          </div>
          
          <!-- Grade Filter -->
          <div>
            <select 
              [(ngModel)]="filters.year"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{{ 'students.allGrades' | translate }}</option>
              <optgroup label="Primary School">
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
              </optgroup>
              <optgroup label="Preparatory School">
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
              </optgroup>
              <optgroup label="Secondary School">
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </optgroup>
            </select>
          </div>

          <!-- Teacher Filter -->
          <div>
            <select 
              [(ngModel)]="filters.teacherId"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{{ 'students.allTeachers' | translate }}</option>
              <option *ngFor="let teacher of teachers" [value]="teacher.id || teacher._id">
                {{ teacher.fullName }}
              </option>
            </select>
          </div>

          <!-- Subject Filter -->
          <div>
            <select 
              [(ngModel)]="filters.subjectId"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{{ 'students.allSubjects' | translate }}</option>
              <option *ngFor="let subject of subjects" [value]="subject.id || subject._id">
                {{ subject.name }} ({{ subject.code }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Bulk Actions (Admin Only) -->
      <div *ngIf="isAdmin && selectedStudents.length > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <span class="text-base font-bold text-gray-900">
                {{ selectedStudents.length }} {{ selectedStudents.length === 1 ? ('students.studentSelected' | translate) : ('students.studentsSelected' | translate) }}
              </span>
              <p class="text-xs text-gray-600">{{ 'students.chooseAction' | translate }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button (click)="bulkDelete()" class="btn-outline text-red-600 border-red-300 hover:bg-red-50">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              {{ 'students.bulkDelete' | translate }}
            </button>
            <button (click)="clearSelection()" class="btn-outline text-gray-600 border-gray-300 hover:bg-gray-50">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              {{ 'students.clearSelection' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        <div class="card-body p-0">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && students.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">{{ 'students.noStudentsFound' | translate }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ 'students.tryAdjustingFilters' | translate }}</p>
            <!-- Admin-only: Add Student Button -->
            <div *ngIf="isAdmin" class="mt-6">
              <button 
                routerLink="/dashboard/students/new"
                class="btn-primary"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {{ 'students.addStudent' | translate }}
              </button>
            </div>
          </div>

          <!-- Students Table -->
          <div *ngIf="!isLoading && students.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left" *ngIf="isAdmin">
                    <input 
                      type="checkbox" 
                      [checked]="allSelected"
                      (click)="toggleAllSelection()"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.name' | translate }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.gradeLevel' | translate }}
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.groups' | translate }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.phone' | translate }}
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.attendanceRate' | translate }}
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ 'students.actions' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let student of students; trackBy: trackByStudentId" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap" *ngIf="isAdmin">
                    <input 
                      type="checkbox" 
                      [checked]="isSelected(student.id)"
                      (click)="toggleSelection(student.id)"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                  </td>
                  <!-- Name Column: Avatar + Name + Email -->
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                          <span class="text-base font-bold text-white">
                            {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900">
                          <a 
                            [routerLink]="['/dashboard/students', student.id]"
                            class="hover:text-blue-600 transition-colors"
                          >
                            {{ student.fullName }}
                          </a>
                        </div>
                        <div class="text-xs text-gray-500 mt-0.5">{{ student.email }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Grade Level Column: Student Code + Grade -->
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ student.academicInfo.studentId }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ student.academicInfo.currentGrade }}</div>
                  </td>
                  
                  <!-- Groups Column: Count Badge -->
                  <td class="px-6 py-4 text-center">
                    <span 
                      *ngIf="student.academicInfo.groups && student.academicInfo.groups.length > 0"
                      class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                    >
                      <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                      </svg>
                      {{ student.academicInfo.groups.length }}
                    </span>
                    <span 
                      *ngIf="!student.academicInfo.groups || student.academicInfo.groups.length === 0"
                      class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-400"
                    >
                      0
                    </span>
                  </td>

                  <!-- Phone Column -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center text-sm text-gray-900">
                      <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      <span *ngIf="student.phoneNumber">{{ student.phoneNumber }}</span>
                      <span *ngIf="!student.phoneNumber && student.parentContact?.primaryPhone" class="text-gray-500">{{ student.parentContact?.primaryPhone }}</span>
                      <span *ngIf="!student.phoneNumber && !student.parentContact?.primaryPhone" class="text-gray-400 italic text-xs">{{ 'students.noPhone' | translate }}</span>
                    </div>
                  </td>

                  <!-- Attendance Rate Column (Role-based scoping) -->
                  <td class="px-6 py-4 text-center">
                    <div class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold"
                         [ngClass]="{
                           'bg-green-100 text-green-700 border-2 border-green-200': (student.attendanceRate || 0) >= 80,
                           'bg-yellow-100 text-yellow-700 border-2 border-yellow-200': (student.attendanceRate || 0) >= 60 && (student.attendanceRate || 0) < 80,
                           'bg-red-100 text-red-700 border-2 border-red-200': (student.attendanceRate || 0) < 60
                         }">
                      <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      {{ (student.attendanceRate || 0) | number:'1.0-0' }}%
                    </div>
                  </td>

                  <!-- Actions Column -->
                  <td class="px-6 py-5 whitespace-nowrap">
                    <div class="relative inline-block text-left">
                      <button 
                        (click)="toggleDropdown(student.id, $event)"
                        class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>

                      <div 
                        *ngIf="openDropdownId === student.id"
                        class="absolute right-0 z-50 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        [class.bottom-full]="dropdownPosition === 'top'"
                        [class.mb-2]="dropdownPosition === 'top'"
                        [class.mt-2]="dropdownPosition === 'bottom'"
                        [class.origin-top-right]="dropdownPosition === 'bottom'"
                        [class.origin-bottom-right]="dropdownPosition === 'top'"
                      >
                        <div class="py-1">
                          <button
                            (click)="viewStudent(student); closeDropdown()"
                            class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          >
                            <svg class="mr-3 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            {{ 'students.view' | translate }}
                          </button>
                          <!-- Admin-only actions -->
                          <button
                            *ngIf="isAdmin"
                            (click)="editStudent(student); closeDropdown()"
                            class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                          >
                            <svg class="mr-3 h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            {{ 'students.edit' | translate }}
                          </button>
                          <div *ngIf="isAdmin" class="border-t border-gray-100"></div>
                          <button
                            *ngIf="isAdmin"
                            (click)="deleteStudent(student); closeDropdown()"
                            class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150"
                          >
                            <svg class="mr-3 h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            {{ 'students.delete' | translate }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="!isLoading && students.length > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 flex justify-between sm:hidden">
                <button 
                  (click)="changePage(pagination.page - 1)"
                  [disabled]="pagination.page <= 1"
                  class="btn-outline"
                >
                  {{ 'pagination.previous' | translate }}
                </button>
                <button 
                  (click)="changePage(pagination.page + 1)"
                  [disabled]="pagination.page >= pagination.pages"
                  class="btn-outline"
                >
                  {{ 'pagination.next' | translate }}
                </button>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    {{ 'students.showing' | translate }}
                    <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                    {{ 'students.to' | translate }}
                    <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                    {{ 'students.of' | translate }}
                    <span class="font-medium">{{ pagination.total }}</span>
                    {{ 'students.results' | translate }}
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button 
                      (click)="changePage(pagination.page - 1)"
                      [disabled]="pagination.page <= 1"
                      class="pagination-btn rounded-l-md"
                    >
                      {{ 'pagination.previous' | translate }}
                    </button>
                    
                    <button 
                      *ngFor="let page of getVisiblePages()"
                      (click)="changePage(page)"
                      [class]="page === pagination.page ? 'pagination-btn-active' : 'pagination-btn'"
                    >
                      {{ page }}
                    </button>
                    
                    <button 
                      (click)="changePage(pagination.page + 1)"
                      [disabled]="pagination.page >= pagination.pages"
                      class="pagination-btn rounded-r-md"
                    >
                      {{ 'pagination.next' | translate }}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-label {
      @apply block text-sm font-medium text-gray-700 mb-1;
    }
    
    .form-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .form-select {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .btn-primary {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .btn-outline {
      @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .btn-danger {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
    }
    
    .btn-sm {
      @apply px-3 py-1 text-xs;
    }
    
    .card {
      @apply bg-white shadow-sm rounded-lg border border-gray-200;
    }
    
    .card-body {
      @apply px-6 py-4;
    }
    
    .pagination-btn {
      @apply relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50;
    }
    
    .pagination-btn-active {
      @apply relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600;
    }
  `]
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  selectedStudents: string[] = [];
  isLoading = false;
  teachers: any[] = [];
  subjects: any[] = [];
  currentUser: any = null;
  
  filters = {
    search: '',
    year: '',
    grade: '',
    teacherId: '',
    subjectId: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  Math = Math; // Make Math available in template

  // Role-based access helpers
  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'teacher' || this.currentUser?.role === 'assistant';
  }
  openDropdownId: string | null = null;
  dropdownPosition: 'bottom' | 'top' = 'bottom';
  private searchDebounce: any;

  constructor(
    private studentService: StudentService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadStudents();
    this.loadTeachers();
    this.loadSubjects();
  }

  loadTeachers(): void {
    this.teacherService.getTeachers({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data?.teachers || res.data || [];
        this.teachers = Array.isArray(list) ? list : [];
      },
      error: (err) => console.error('Error loading teachers:', err)
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data?.subjects || res.data || [];
        this.subjects = Array.isArray(list) ? list : [];
      },
      error: (err) => console.error('Error loading subjects:', err)
    });
  }

  // Navigation methods
  addNewStudent(): void {
    this.router.navigate(['/dashboard/students/new']);
  }

  viewStudent(student: Student): void {
    this.router.navigate(['/dashboard/students', student.id]);
  }

  editStudent(student: Student): void {
    this.router.navigate(['/dashboard/students', student.id, 'edit']);
  }

  loadStudents(): void {
    this.isLoading = true;
    
    const params = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filters
    };

    console.log('Loading students with params:', params, 'Role:', this.currentUser?.role);

    // Backend automatically filters students based on user role
    this.studentService.getStudents(params).subscribe({
      next: (response: any) => {
        console.log('Students API response:', response);
        if (response.success) {
          // Handle the response structure from our backend
          if (response.data && response.data.students) {
            this.students = response.data.students;
            this.pagination = response.data.pagination || this.pagination;
          } else if (Array.isArray(response.data)) {
            // Fallback if data is directly an array
            this.students = response.data;
          } else {
            console.warn('Unexpected response structure:', response);
            this.students = [];
          }
        } else {
          console.error('API returned success: false', response);
          this.students = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading students:', error);
        this.isLoading = false;
        // You might want to show a toast notification here
      }
    });
  }

  onFiltersChange(): void {
    console.log('Filter changed! Current filters:', this.filters);
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
      year: '',
      grade: '',
      teacherId: '',
      subjectId: ''
    };
    this.pagination.page = 1;
    this.loadStudents();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.year || this.filters.teacherId || this.filters.subjectId);
  }

  removeFilter(key: 'search' | 'year' | 'teacherId' | 'subjectId'): void {
    (this.filters as any)[key] = '';
    this.pagination.page = 1;
    this.loadStudents();
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.teachers.find(t => (t.id || t._id) === teacherId);
    return teacher ? teacher.fullName : 'Unknown';
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => (s.id || s._id) === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown';
  }

  changePage(page: number): void {
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

  // Selection methods
  get allSelected(): boolean {
    return this.students.length > 0 && this.selectedStudents.length === this.students.length;
  }

  get someSelected(): boolean {
    return this.selectedStudents.length > 0 && this.selectedStudents.length < this.students.length;
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedStudents = [];
    } else {
      this.selectedStudents = this.students.map(s => s.id);
    }
  }

  toggleSelection(studentId: string): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  isSelected(studentId: string): boolean {
    return this.selectedStudents.includes(studentId);
  }

  clearSelection(): void {
    this.selectedStudents = [];
  }

  // Bulk operations
  async bulkDelete(): Promise<void> {
    if (this.selectedStudents.length === 0) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Students',
      message: `Are you sure you want to delete ${this.selectedStudents.length} student(s)? This action cannot be undone and will remove all their records and enrollments.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.studentService.bulkAction('delete', this.selectedStudents).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStudents();
            this.clearSelection();
          }
        },
        error: (error) => {
          console.error('Error deleting students:', error);
        }
      });
    }
  }

  // Individual operations
  async deleteStudent(student: Student): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Student',
      message: `Are you sure you want to delete ${student.fullName}? This action cannot be undone and will remove all their records and enrollments.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStudents();
          }
        },
        error: (error) => {
          console.error('Error deleting student:', error);
        }
      });
    }
  }

  // Dropdown methods
  toggleDropdown(studentId: string, event?: MouseEvent): void {
    if (this.openDropdownId === studentId) {
      this.closeDropdown();
      return;
    }
    
    this.openDropdownId = studentId;
    
    // Calculate position if event is provided
    if (event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 250px below and more space above, position above
      this.dropdownPosition = (spaceBelow < 250 && spaceAbove > spaceBelow) ? 'top' : 'bottom';
    } else {
      this.dropdownPosition = 'bottom';
    }
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.dropdownPosition = 'bottom';
  }

  // Utility methods
  trackByStudentId(index: number, student: Student): string {
    return student.id;
  }

  // Export/Import methods
  exportStudents(): void {
    if (this.students.length === 0) return;
    
    // Create CSV content
    const headers = ['Student ID', 'Name', 'Email', 'Grade', 'Enrollment Date'];
    const csvContent = [
      headers.join(','),
      ...this.students.map(student => [
        student.academicInfo.studentId,
        `"${student.fullName}"`,
        student.email,
        student.academicInfo.currentGrade,
        new Date(student.academicInfo.enrollmentDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importStudents(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const csv = e.target.result;
          this.processCsvImport(csv);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private processCsvImport(csv: string): void {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    // TODO: Implement CSV parsing and validation
    console.log('CSV Import - Headers:', headers);
    console.log('CSV Import - Lines:', lines.length - 1);
    
    this.toastService.info(`CSV import functionality will be implemented. Found ${lines.length - 1} rows to process.`, 'Import Preview');
  }

}