import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Attendance</h1>
          <p class="text-gray-600">Track and manage student attendance</p>
        </div>
        <button class="btn-primary">Take Attendance</button>
      </div>
      <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-medium text-gray-900">Attendance Management</h3>
        <p class="mt-1 text-sm text-gray-500">Track daily attendance and generate reports.</p>
      </div>
    </div>
  `
})
export class AttendanceListComponent {}
