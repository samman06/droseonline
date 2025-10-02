import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Groups</h1>
          <p class="text-gray-600">Manage student groups and classes</p>
        </div>
        <button class="btn-primary">Add Group</button>
      </div>
      <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-medium text-gray-900">Group Management</h3>
        <p class="mt-1 text-sm text-gray-500">Organize students into groups and classes.</p>
      </div>
    </div>
  `
})
export class GroupListComponent {}
