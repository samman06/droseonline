import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Subjects</h1>
          <p class="text-gray-600">Manage academic subjects and curriculum</p>
        </div>
        <button class="btn-primary">Add Subject</button>
      </div>
      <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-medium text-gray-900">Subject Management</h3>
        <p class="mt-1 text-sm text-gray-500">Available for curriculum management.</p>
      </div>
    </div>
  `
})
export class SubjectListComponent {}
