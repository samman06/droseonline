import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubjectService } from '../../services/subject.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">Back to Subjects</span>
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ subject?.name }}</h1>
          <p class="text-gray-600">Code: {{ subject?.code }}</p>
        </div>
        <div class="space-x-3">
          <button (click)="edit()" class="btn-edit">Edit</button>
          <button (click)="delete()" class="btn-danger">Delete</button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="px-8 py-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Details</h2>
        </div>
        <div class="p-8 space-y-4">
          <!-- No total marks on subject -->
          <div class="text-gray-700"><span class="font-semibold">Status:</span>
            <span class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm" [class]="subject?.isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'">
              <span class="w-2 h-2 rounded-full mr-2" [class]="subject?.isActive ? 'bg-white animate-pulse' : 'bg-white'"></span>
              {{ subject?.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-edit { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200; }
    .btn-danger { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-red-600 hover:bg-red-50 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200; }
  `]
})
export class SubjectDetailComponent implements OnInit {
  subject: any;

  constructor(private subjectService: SubjectService, private route: ActivatedRoute, private router: Router, private confirmation: ConfirmationService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.subjectService.getSubject(id).subscribe({ next: (res) => this.subject = res.data?.subject });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/subjects']);
  }

  edit(): void { this.router.navigate(['/dashboard/subjects', this.subject?.id || this.subject?._id, 'edit']); }

  async delete(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete ${this.subject?.name}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    this.subjectService.deleteSubject(this.subject?.id || this.subject?._id).subscribe({ next: _ => this.router.navigate(['/dashboard/subjects']) });
  }
}


