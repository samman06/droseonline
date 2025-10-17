import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { GroupService } from '../../services/group.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <!-- Enhanced Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {{ isEditMode ? 'Edit' : 'Create' }} Assignment
            </h1>
            <p class="text-gray-600 mt-1">{{ isEditMode ? 'Update assignment details and settings' : 'Create a new assignment for your students' }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        <p class="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>

      <form *ngIf="!loading" [formGroup]="assignmentForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Enhanced Basic Information -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 p-5">
            <div class="flex items-center">
              <div class="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md mr-3">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>
          </div>
          <div class="p-6">
          
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Title <span class="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  formControlName="title"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter assignment title">
                <div *ngIf="assignmentForm.get('title')?.invalid && assignmentForm.get('title')?.touched" class="text-red-500 text-sm mt-1">
                  Title is required
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Code <span class="text-xs text-gray-500">(Auto-generated)</span>
                </label>
                <input 
                  type="text" 
                  formControlName="code"
                  class="w-full rounded-lg border-gray-300 bg-gray-100 cursor-not-allowed shadow-sm"
                  placeholder="Auto-generated (e.g., AS-000001)"
                  [disabled]="true">
                <p class="text-xs text-gray-500 mt-1">Code will be automatically generated when you save</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description <span class="text-red-500">*</span>
              </label>
              <textarea 
                formControlName="description"
                rows="4"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter detailed description of the assignment"></textarea>
              <div *ngIf="assignmentForm.get('description')?.invalid && assignmentForm.get('description')?.touched" class="text-red-500 text-sm mt-1">
                Description is required (minimum 20 characters)
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type <span class="text-red-500">*</span>
                </label>
                <select formControlName="type" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="project">Project</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Groups <span class="text-red-500">*</span>
                </label>
                
                <!-- Custom Multi-Select Dropdown -->
                <div class="relative">
                  <button
                    type="button"
                    (click)="toggleGroupsDropdown()"
                    class="w-full px-4 py-2.5 text-left bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all flex items-center justify-between"
                    [ngClass]="{'border-red-500': assignmentForm.get('groups')?.invalid && assignmentForm.get('groups')?.touched}">
                    <span class="text-gray-700">
                      <span *ngIf="selectedGroups.length === 0" class="text-gray-400">Select groups...</span>
                      <span *ngIf="selectedGroups.length > 0">{{ selectedGroups.length }} group(s) selected</span>
                    </span>
                    <svg class="w-5 h-5 text-gray-400 transition-transform" [class.rotate-180]="showGroupsDropdown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div *ngIf="showGroupsDropdown" class="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <div *ngIf="groups.length === 0" class="px-4 py-3 text-sm text-gray-500 text-center">
                      No groups available
                    </div>
                    <div *ngFor="let group of groups" 
                         (click)="toggleGroupSelection(group)"
                         class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors">
                      <label class="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          [checked]="isGroupSelected(group._id)"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          (click)="$event.stopPropagation()">
                        <div class="ml-3 flex-1">
                          <div class="text-sm font-medium text-gray-900">{{ group.name }}</div>
                          <div class="text-xs text-gray-500">{{ group.code }} • {{ group.gradeLevel }}</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Selected Groups Display -->
                <div *ngIf="selectedGroups.length > 0" class="mt-2 flex flex-wrap gap-2">
                  <span *ngFor="let group of selectedGroups" 
                        class="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
                    {{ group.name }} ({{ group.code }})
                    <button 
                      type="button"
                      (click)="removeGroupSelection(group._id)"
                      class="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </span>
                </div>
                
                <p class="text-xs text-gray-500 mt-2">
                  <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  Click to select multiple groups. All groups must belong to the same course.
                </p>
                
                <div *ngIf="assignmentForm.get('groups')?.invalid && assignmentForm.get('groups')?.touched" class="flex items-center text-red-600 text-sm mt-2">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  At least one group is required
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Enhanced Dates and Points -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-5">
            <div class="flex items-center">
              <div class="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md mr-3">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Schedule & Grading</h2>
            </div>
          </div>
          <div class="p-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span class="text-red-500">*</span>
              </label>
              <input 
                type="datetime-local" 
                formControlName="dueDate"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <div *ngIf="assignmentForm.get('dueDate')?.invalid && assignmentForm.get('dueDate')?.touched" class="text-red-500 text-sm mt-1">
                Due date is required
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Max Points <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                formControlName="maxPoints"
                min="1"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="100">
              <div *ngIf="assignmentForm.get('maxPoints')?.invalid && assignmentForm.get('maxPoints')?.touched" class="text-red-500 text-sm mt-1">
                Max points is required (minimum 1)
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Enhanced Grading Rubric -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md mr-3">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900">Grading Rubric</h2>
              </div>
              <button 
                type="button" 
                (click)="addRubricCriterion()"
                class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Criterion
              </button>
            </div>
          </div>
          <div class="p-6">

          <div formArrayName="rubric" class="space-y-3">
            <div *ngFor="let criterion of rubric.controls; let i = index" [formGroupName]="i" 
                 class="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <input 
                  type="text" 
                  formControlName="name"
                  class="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Criterion name">
              </div>
              <div class="w-24">
                <input 
                  type="number" 
                  formControlName="points"
                  min="0"
                  class="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Points">
              </div>
              <button 
                type="button" 
                (click)="removeRubricCriterion(i)"
                class="text-red-600 hover:text-red-800 p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div *ngIf="rubric.length === 0" class="text-center py-6 text-gray-500 text-sm">
            No rubric criteria added. Click "Add Criterion" to create grading criteria.
          </div>
          </div>
        </div>

        <!-- Enhanced Submission Settings -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-5">
            <div class="flex items-center">
              <div class="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md mr-3">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Submission Settings</h2>
            </div>
          </div>
          <div class="p-6">
          
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" formControlName="allowLateSubmissions" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Allow late submissions</span>
            </label>

            <div *ngIf="assignmentForm.get('allowLateSubmissions')?.value" class="ml-6 mt-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Late Penalty (%)</label>
              <input 
                type="number" 
                formControlName="latePenalty"
                min="0"
                max="100"
                class="w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="10">
            </div>

            <label class="flex items-center">
              <input type="checkbox" formControlName="requireFileUpload" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Require file upload</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" formControlName="allowMultipleSubmissions" 
                     class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Allow multiple submissions (students can resubmit)</span>
            </label>
          </div>
          </div>
        </div>

        <!-- Enhanced Instructions -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-gray-200 p-5">
            <div class="flex items-center">
              <div class="p-2 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg shadow-md mr-3">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Additional Instructions</h2>
            </div>
          </div>
          <div class="p-6">
            <textarea 
              formControlName="instructions"
              rows="6"
              class="w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              placeholder="Enter detailed instructions, requirements, or guidelines for students..."></textarea>
            <p class="text-xs text-gray-500 mt-2">
              <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              Provide clear and detailed instructions to help students understand requirements and expectations.
            </p>
          </div>
        </div>

        <!-- Enhanced Action Buttons -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p class="text-sm text-gray-600">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              {{ isEditMode ? 'Update the assignment details' : 'Create and publish your assignment' }}
            </p>
            <div class="flex gap-3">
              <button 
                type="button" 
                (click)="cancel()"
                class="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all transform hover:-translate-y-0.5 shadow-sm">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancel
              </button>
              <button 
                *ngIf="!isEditMode"
                type="button" 
                (click)="saveDraft()"
                [disabled]="saving"
                class="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all transform hover:-translate-y-0.5 shadow-md">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
                Save as Draft
              </button>
              <button 
                type="submit" 
                [disabled]="saving || assignmentForm.invalid"
                class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all transform hover:-translate-y-0.5 shadow-lg">
                <svg *ngIf="!saving" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <svg *ngIf="saving" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ saving ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Publish Assignment') }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class AssignmentFormComponent implements OnInit {
  assignmentForm!: FormGroup;
  isEditMode = false;
  assignmentId: string | null = null;
  loading = false;
  saving = false;
  currentUser: any;
  groups: any[] = [];
  selectedGroups: any[] = [];
  showGroupsDropdown = false;

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private groupService: GroupService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    this.loadGroups();
    
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    if (this.assignmentId) {
      this.isEditMode = true;
      this.loadAssignment();
    }
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      code: [{value: '', disabled: true}], // Auto-generated, not required
      title: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      type: ['homework', Validators.required],
      groups: [[], [Validators.required, Validators.minLength(1)]], // Groups are required
      dueDate: ['', Validators.required],
      maxPoints: [100, [Validators.required, Validators.min(1)]],
      rubric: this.fb.array([]),
      allowLateSubmissions: [true],
      latePenalty: [10],
      requireFileUpload: [false],
      allowMultipleSubmissions: [true],
      instructions: ['']
    });
  }

  get rubric(): FormArray {
    return this.assignmentForm.get('rubric') as FormArray;
  }

  addRubricCriterion(): void {
    const criterion = this.fb.group({
      name: ['', Validators.required],
      points: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
    this.rubric.push(criterion);
  }

  removeRubricCriterion(index: number): void {
    this.rubric.removeAt(index);
  }

  loadGroups(): void {
    this.groupService.getGroups({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested response structure
          this.groups = response.data.groups || response.data || [];
          console.log('Loaded groups:', this.groups.length);
          
          // Check if there's a pre-selected group from localStorage
          const preSelectedGroupData = localStorage.getItem('preSelectedGroup');
          if (preSelectedGroupData && !this.isEditMode) {
            try {
              const preSelectedGroup = JSON.parse(preSelectedGroupData);
              const group = this.groups.find(g => (g._id || g.id) === preSelectedGroup.id);
              
              if (group) {
                // Auto-select the group
                this.selectedGroups = [group];
                this.assignmentForm.patchValue({
                  groups: [preSelectedGroup.id]
                });
                
                this.toastService.success(`Group "${preSelectedGroup.name}" pre-selected`);
              }
              
              // Clear the localStorage after use
              localStorage.removeItem('preSelectedGroup');
            } catch (error) {
              console.error('Error parsing pre-selected group:', error);
              localStorage.removeItem('preSelectedGroup');
            }
          }
        }
      },
      error: (error) => {
        console.error('Failed to load groups', error);
        this.toastService.error('Failed to load groups');
      }
    });
  }

  toggleGroupsDropdown(): void {
    this.showGroupsDropdown = !this.showGroupsDropdown;
  }

  toggleGroupSelection(group: any): void {
    const index = this.selectedGroups.findIndex(g => g._id === group._id);
    if (index > -1) {
      // Remove group
      this.selectedGroups.splice(index, 1);
    } else {
      // Add group
      this.selectedGroups.push(group);
    }
    // Update form control
    this.assignmentForm.patchValue({
      groups: this.selectedGroups.map(g => g._id)
    });
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups.some(g => g._id === groupId);
  }

  removeGroupSelection(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(g => g._id !== groupId);
    // Update form control
    this.assignmentForm.patchValue({
      groups: this.selectedGroups.map(g => g._id)
    });
  }

  loadAssignment(): void {
    if (!this.assignmentId) return;
    
    this.loading = true;
    this.assignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const assignment = response.data;
          
          // Format due date for datetime-local input
          const dueDate = assignment.dueDate 
            ? new Date(assignment.dueDate).toISOString().slice(0, 16) 
            : '';

          this.assignmentForm.patchValue({
            title: assignment.title,
            description: assignment.description,
            type: assignment.type,
            course: assignment.course,
            dueDate,
            maxPoints: assignment.maxPoints,
            allowLateSubmissions: assignment.allowLateSubmissions,
            latePenalty: assignment.latePenalty || 10,
            requireFileUpload: assignment.requireFileUpload,
            allowMultipleSubmissions: assignment.allowMultipleSubmissions,
            instructions: assignment.instructions
          });

          // Load rubric criteria
          if (assignment.rubric && assignment.rubric.length > 0) {
            assignment.rubric.forEach((criterion: any) => {
              const criterionGroup = this.fb.group({
                name: [criterion.name, Validators.required],
                points: [criterion.points, [Validators.required, Validators.min(0)]],
                description: [criterion.description || '']
              });
              this.rubric.push(criterionGroup);
            });
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/assignments']);
      }
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid || this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'published';

    this.saving = true;
    const request = this.isEditMode && this.assignmentId
      ? this.assignmentService.updateAssignment(this.assignmentId, formData)
      : this.assignmentService.createAssignment(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.isEditMode ? 'Assignment updated successfully' : 'Assignment published successfully'
          );
          this.router.navigate(['/dashboard/assignments']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  saveDraft(): void {
    if (this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'draft';

    this.saving = true;
    this.assignmentService.createAssignment(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Assignment saved as draft');
          this.router.navigate(['/dashboard/assignments']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  prepareFormData(): any {
    const formValue = this.assignmentForm.value;
    
    return {
      title: formValue.title,
      description: formValue.description,
      type: formValue.type,
      course: formValue.course || undefined,
      dueDate: formValue.dueDate,
      maxPoints: formValue.maxPoints,
      rubric: formValue.rubric,
      allowLateSubmissions: formValue.allowLateSubmissions,
      latePenalty: formValue.allowLateSubmissions ? formValue.latePenalty : 0,
      requireFileUpload: formValue.requireFileUpload,
      allowMultipleSubmissions: formValue.allowMultipleSubmissions,
      instructions: formValue.instructions
    };
  }

  cancel(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

