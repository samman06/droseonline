import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { SubjectService } from '../../services/subject.service';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  academicInfo: {
    employeeId: string;
    hireDate: Date;
    subjects: any[];
    groups: any[];
  };
  stats?: {
    coursesCount: number;
    subjectsCount: number;
    groupsCount: number;
  };
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section with Enhanced Design -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Teachers Management
              </h1>
              <p class="mt-1 text-gray-600">Manage teacher profiles, assignments, and performance</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  {{ pagination.total }} Total
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {{ getActiveTeachersCount() }} Active
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <button (click)="exportTeachers()" class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export Data
            </button>
            <button (click)="addNewTeacher()" class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add New Teacher
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Filters Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">Filters</h3>
          <button (click)="clearFilters()" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            Clear Filters
          </button>
        </div>

        <!-- Active Filter Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Search: {{ filters.search }}
            <button (click)="removeFilter('search')" class="ml-2 text-purple-600 hover:text-purple-800">×</button>
          </span>
          <span *ngIf="filters.subjectId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Subject: {{ getSubjectName(filters.subjectId) }}
            <button (click)="removeFilter('subjectId')" class="ml-2 text-purple-600 hover:text-purple-800">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Search -->
          <div>
            <input 
              type="text" 
              [(ngModel)]="filters.search" 
              (ngModelChange)="onSearchChange($event)" 
              class="form-input" 
              placeholder="🔍 Search by name, email, or ID..."
            >
          </div>
          
          <!-- Subject Filter (Dropdown) -->
          <div>
            <select 
              [(ngModel)]="filters.subjectId" 
              (ngModelChange)="onFiltersChange()" 
              class="form-select"
            >
              <option value="">All Subjects</option>
              <option *ngFor="let subject of subjects" [value]="subject.id || subject._id">
                {{ subject.name }} ({{ subject.code }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Enhanced Bulk Actions -->
      <div *ngIf="selectedTeachers.length > 0" class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-sm border-2 border-orange-200">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm font-medium text-orange-800">
                {{ selectedTeachers.length }} teacher(s) selected
              </span>
            </div>
            <div class="flex space-x-2">
              <button (click)="bulkActivate()" class="btn-outline text-green-600 border-green-300 hover:bg-green-50">
                Activate Selected
              </button>
              <button (click)="bulkDeactivate()" class="btn-outline text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                Deactivate Selected
              </button>
              <button (click)="bulkDelete()" class="btn-outline text-red-600 border-red-300 hover:bg-red-50">
                Delete Selected
              </button>
              <button (click)="clearSelection()" class="btn-outline">
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-500">Loading teachers...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && teachers.length === 0" class="text-center py-12 card">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by adding a new teacher to the system.</p>
        <div class="mt-6">
          <button (click)="addNewTeacher()" class="btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Teacher
          </button>
        </div>
      </div>

      <!-- Enhanced Teachers Table -->
      <div *ngIf="!isLoading && teachers.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th class="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    [checked]="allSelected" 
                    [indeterminate]="someSelected"
                    (change)="toggleAllSelection()"
                    class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  >
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Teacher Information
                </th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Courses
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Subjects
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-1.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Groups
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr *ngFor="let teacher of teachers; trackBy: trackByTeacherId" 
                  class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-transparent hover:border-indigo-500">
                <td class="px-6 py-5 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    [checked]="isSelected(teacher.id)"
                    (change)="toggleSelection(teacher.id)"
                    class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  >
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                      <div class="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg ring-2 ring-white">
                        <span class="text-base font-bold text-white">
                          {{ teacher.firstName.charAt(0) + teacher.lastName.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-bold text-gray-900">{{ teacher.fullName }}</div>
                      <div class="text-sm text-gray-600 flex items-center mt-0.5">
                        <svg class="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        {{ teacher.email }}
                      </div>
                      <div class="text-xs text-gray-500 font-mono mt-0.5">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          ID: {{ teacher.academicInfo.employeeId }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200">
                    <span class="text-2xl font-bold text-indigo-700">{{ teacher.stats?.coursesCount || 0 }}</span>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div class="flex flex-wrap gap-2">
                    <span *ngFor="let subject of teacher.academicInfo.subjects" 
                          class="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-xs font-semibold border border-blue-200">
                      {{ subject.name }}
                    </span>
                    <span *ngIf="!teacher.academicInfo.subjects || teacher.academicInfo.subjects.length === 0"
                          class="text-sm text-gray-400 italic">
                      No subjects assigned
                    </span>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                    <span class="text-2xl font-bold text-purple-700">{{ teacher.stats?.groupsCount || 0 }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                  <div class="relative inline-block text-left">
                    <button 
                      (click)="toggleDropdown(teacher.id)"
                      class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>

                    <div 
                      *ngIf="openDropdownId === teacher.id"
                      class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div class="py-1">
                        <button
                          (click)="viewTeacher(teacher); closeDropdown()"
                          class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        >
                          <svg class="mr-3 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          View Details
                        </button>
                        <button
                          (click)="editTeacher(teacher); closeDropdown()"
                          class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                        >
                          <svg class="mr-3 h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Edit Teacher
                        </button>
                        <div class="border-t border-gray-100"></div>
                        <button
                          (click)="deleteTeacher(teacher); closeDropdown()"
                          class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150"
                        >
                          <svg class="mr-3 h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Delete Teacher
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
        <div *ngIf="pagination.pages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button 
              (click)="changePage(pagination.page - 1)"
              [disabled]="pagination.page === 1"
              [class.opacity-50]="pagination.page === 1"
              [class.cursor-not-allowed]="pagination.page === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              (click)="changePage(pagination.page + 1)"
              [disabled]="pagination.page === pagination.pages"
              [class.opacity-50]="pagination.page === pagination.pages"
              [class.cursor-not-allowed]="pagination.page === pagination.pages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  (click)="changePage(pagination.page - 1)"
                  [disabled]="pagination.page === 1"
                  [class.opacity-50]="pagination.page === 1"
                  [class.cursor-not-allowed]="pagination.page === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <button 
                  *ngFor="let page of getVisiblePages()"
                  (click)="changePage(page)"
                  [class.bg-blue-50]="page === pagination.page"
                  [class.border-blue-500]="page === pagination.page"
                  [class.text-blue-600]="page === pagination.page"
                  [class.bg-white]="page !== pagination.page"
                  [class.border-gray-300]="page !== pagination.page"
                  [class.text-gray-500]="page !== pagination.page"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-50"
                >
                  {{ page }}
                </button>
                
                <button 
                  (click)="changePage(pagination.page + 1)"
                  [disabled]="pagination.page === pagination.pages"
                  [class.opacity-50]="pagination.page === pagination.pages"
                  [class.cursor-not-allowed]="pagination.page === pagination.pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary { 
      @apply inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white 
      bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
      transition-all duration-200;
    }
    .btn-secondary { 
      @apply inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 
      bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
      transition-all duration-200;
    }
    .btn-outline { 
      @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 
      bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
      transition-all duration-200;
    }
    .stat-card { 
      @apply bg-white rounded-xl shadow-md border overflow-hidden 
      transition-all duration-300 cursor-pointer;
    }
    .stat-card-body { @apply p-5; }
    .card { @apply bg-white shadow-sm rounded-xl border border-gray-200; }
    .card-body { @apply px-6 py-4; }
    .form-input { 
      @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm 
      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
      transition-all duration-200 placeholder-gray-400;
    }
    .form-select { 
      @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm 
      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
      transition-all duration-200 bg-white;
    }
    .form-label { @apply block text-sm font-semibold text-gray-700 mb-2; }
    .action-btn {
      @apply p-2 rounded-lg transition-all duration-200 hover:bg-gray-100;
    }
  `]
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  selectedTeachers: string[] = [];
  isLoading = false;
  openDropdownId: string | null = null;
  subjects: any[] = [];
  private searchDebounce: any;
  
  filters = {
    search: '',
    subjectId: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  Math = Math;

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.subjectService.getSubjects({ isActive: 'true', page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data?.subjects || res.data || [];
        this.subjects = Array.isArray(list) ? list : [];
      },
      error: (err) => console.error('Error loading subjects:', err)
    });
  }

  loadTeachers(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.subjectId) params.subject = this.filters.subjectId;

    this.teacherService.getTeachers(params).subscribe({
      next: (response) => {
        console.log('Teachers response:', response);
        if (response.success && response.data) {
          this.teachers = response.data.teachers || [];
          if (response.data.pagination) {
            this.pagination = {
              ...this.pagination,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            };
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.teachers = [];
        this.isLoading = false;
      }
    });
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadTeachers();
  }

  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.pagination.page = 1;
      this.loadTeachers();
    }, 300);
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      subjectId: ''
    };
    this.pagination.page = 1;
    this.loadTeachers();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.subjectId);
  }

  removeFilter(key: 'search' | 'subjectId'): void {
    (this.filters as any)[key] = '';
    this.pagination.page = 1;
    this.loadTeachers();
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => (s.id || s._id) === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown';
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadTeachers();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  isSelected(teacherId: string): boolean {
    return this.selectedTeachers.includes(teacherId);
  }

  toggleSelection(teacherId: string): void {
    const index = this.selectedTeachers.indexOf(teacherId);
    if (index > -1) {
      this.selectedTeachers.splice(index, 1);
    } else {
      this.selectedTeachers.push(teacherId);
    }
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedTeachers = [];
    } else {
      this.selectedTeachers = this.teachers.map(t => t.id);
    }
  }

  get allSelected(): boolean {
    return this.teachers.length > 0 && this.selectedTeachers.length === this.teachers.length;
  }

  get someSelected(): boolean {
    return this.selectedTeachers.length > 0 && this.selectedTeachers.length < this.teachers.length;
  }

  clearSelection(): void {
    this.selectedTeachers = [];
  }

  async bulkActivate(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Activate Teachers',
      message: `Are you sure you want to activate ${this.selectedTeachers.length} teacher(s)? They will be able to access the system and perform their duties.`,
      confirmText: 'Yes, Activate',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (confirmed) {
      this.teacherService.bulkAction('activate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk activate error:', error);
        }
      });
    }
  }

  async bulkDeactivate(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Deactivate Teachers',
      message: `Are you sure you want to deactivate ${this.selectedTeachers.length} teacher(s)? They will lose access to the system temporarily.`,
      confirmText: 'Yes, Deactivate',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      this.teacherService.bulkAction('deactivate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk deactivate error:', error);
        }
      });
    }
  }

  async bulkDelete(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Teachers',
      message: `Are you sure you want to delete ${this.selectedTeachers.length} teacher(s)? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.teacherService.bulkAction('delete', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk delete error:', error);
        }
      });
    }
  }

  async deleteTeacher(teacher: Teacher): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Teacher',
      message: `Are you sure you want to delete ${teacher.fullName}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.teacherService.deleteTeacher(teacher.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Error deleting teacher:', error);
        }
      });
    }
  }

  exportTeachers(): void {
    if (this.teachers.length === 0) return;
    
    const headers = ['Employee ID', 'Name', 'Email', 'Courses', 'Subjects', 'Groups'];
    const csvContent = [
      headers.join(','),
      ...this.teachers.map(teacher => {
        const subjectNames = teacher.academicInfo.subjects?.map((s: any) => s.name).join('; ') || 'None';
        return [
          teacher.academicInfo.employeeId,
          `"${teacher.fullName}"`,
          teacher.email,
          teacher.stats?.coursesCount || 0,
          `"${subjectNames}"`,
          teacher.stats?.groupsCount || 0
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByTeacherId(index: number, teacher: Teacher): string {
    return teacher.id;
  }

  // Navigation methods
  addNewTeacher(): void {
    this.router.navigate(['/dashboard/teachers/new']);
  }

  viewTeacher(teacher: Teacher): void {
    this.router.navigate(['/dashboard/teachers', teacher.id]);
  }

  editTeacher(teacher: Teacher): void {
    this.router.navigate(['/dashboard/teachers', teacher.id, 'edit']);
  }

  // Statistics methods
  getActiveTeachersCount(): number {
    return this.teachers.filter(teacher => teacher.isActive).length;
  }

  getDepartmentCount(): number {
    // Total number of unique subjects taught
    const allSubjects = this.teachers.flatMap(t => t.academicInfo.subjects || []);
    return new Set(allSubjects.map(s => s._id || s)).size;
  }

  getNewTeachersThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.teachers.filter(teacher => {
      const hireDate = new Date(teacher.academicInfo.hireDate);
      return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
    }).length;
  }

  getCertifiedTeachersCount(): number {
    // Teachers assigned to groups
    return this.teachers.filter(teacher => 
      teacher.academicInfo.groups && teacher.academicInfo.groups.length > 0
    ).length;
  }

  // Dropdown management
  toggleDropdown(teacherId: string): void {
    this.openDropdownId = this.openDropdownId === teacherId ? null : teacherId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }
}

