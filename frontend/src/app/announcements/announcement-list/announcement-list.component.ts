import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnouncementService, Announcement } from '../../services/announcement.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Announcements</h1>
          <p class="text-gray-600 mt-1">View and manage system announcements</p>
        </div>
        <button 
          *ngIf="canCreateAnnouncement"
          [routerLink]="['/dashboard/announcements/new']"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Announcement
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select [(ngModel)]="filters.type" (change)="loadAnnouncements()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="emergency">Emergency</option>
              <option value="maintenance">Maintenance</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select [(ngModel)]="filters.priority" (change)="loadAnnouncements()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" [(ngModel)]="filters.search" (input)="onSearchChange()" 
                   placeholder="Search announcements..." 
                   class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div class="flex items-end">
            <button (click)="resetFilters()" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Announcements List -->
      <div *ngIf="!loading && announcements.length > 0" class="space-y-4">
        <!-- Pinned Announcements -->
        <div *ngFor="let announcement of pinnedAnnouncements" 
             class="bg-gradient-to-r from-yellow-50 to-white rounded-lg shadow-md border-l-4 border-yellow-500 p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Pinned
                </span>
                <span [class]="getPriorityClass(announcement.priority)">
                  {{ announcement.priority }}
                </span>
                <span [class]="getTypeClass(announcement.type)">
                  {{ announcement.type }}
                </span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">{{ announcement.title }}</h3>
              <p class="text-gray-700 mb-3">{{ announcement.content }}</p>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>{{ announcement.author?.firstName }} {{ announcement.author?.lastName }}</span>
                <span>{{ formatDate(announcement.publishAt) }}</span>
                <span *ngIf="announcement.stats?.totalViews">
                  {{ announcement.stats?.totalViews }} views
                </span>
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <button *ngIf="canEdit(announcement)" 
                      [routerLink]="['/dashboard/announcements', announcement._id, 'edit']"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Regular Announcements -->
        <div *ngFor="let announcement of regularAnnouncements" 
             class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span [class]="getPriorityClass(announcement.priority)">
                  {{ announcement.priority }}
                </span>
                <span [class]="getTypeClass(announcement.type)">
                  {{ announcement.type }}
                </span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ announcement.title }}</h3>
              <p class="text-gray-600 mb-3">{{ announcement.content }}</p>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>{{ announcement.author?.firstName }} {{ announcement.author?.lastName }}</span>
                <span>{{ formatDate(announcement.publishAt) }}</span>
                <span *ngIf="announcement.stats?.totalViews">
                  {{ announcement.stats?.totalViews }} views
                </span>
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <button [routerLink]="['/dashboard/announcements', announcement._id]"
                      class="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="View Details">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
              <button *ngIf="canEdit(announcement)" 
                      [routerLink]="['/dashboard/announcements', announcement._id, 'edit']"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button *ngIf="canDelete(announcement)" 
                      (click)="deleteAnnouncement(announcement)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && announcements.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new announcement.</p>
        <div class="mt-6" *ngIf="canCreateAnnouncement">
          <button [routerLink]="['/dashboard/announcements/new']"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            New Announcement
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && announcements.length > 0 && pagination.total > pagination.limit" 
           class="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
        <div class="flex flex-1 justify-between sm:hidden">
          <button (click)="previousPage()" [disabled]="pagination.page === 1"
                  class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Previous
          </button>
          <button (click)="nextPage()" [disabled]="pagination.page >= pagination.pages"
                  class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Next
          </button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
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
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button (click)="previousPage()" [disabled]="pagination.page === 1"
                      class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/>
                </svg>
              </button>
              <button *ngFor="let page of getPages()" (click)="goToPage(page)"
                      [class.bg-blue-600]="page === pagination.page"
                      [class.text-white]="page === pagination.page"
                      [class.text-gray-900]="page !== pagination.page"
                      class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                {{ page }}
              </button>
              <button (click)="nextPage()" [disabled]="pagination.page >= pagination.pages"
                      class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnnouncementListComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = false;
  Math = Math;

  filters = {
    type: '',
    priority: '',
    search: '',
    status: 'published'
  };

  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  currentUser: any;
  searchTimeout: any;

  constructor(
    private announcementService: AnnouncementService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      status: this.filters.status
    };

    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.priority) params.priority = this.filters.priority;
    if (this.filters.search) params.search = this.filters.search;

    this.announcementService.getAnnouncements(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.announcements = response.data;
          if (response.pagination) {
            this.pagination = response.pagination;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.pagination.page = 1;
      this.loadAnnouncements();
    }, 500);
  }

  resetFilters(): void {
    this.filters = {
      type: '',
      priority: '',
      search: '',
      status: 'published'
    };
    this.pagination.page = 1;
    this.loadAnnouncements();
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
      this.announcementService.deleteAnnouncement(announcement._id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showDeleteSuccess('Announcement');
            this.loadAnnouncements();
          }
        },
        error: (error) => {
          this.toastService.showApiError(error);
        }
      });
    }
  }

  get pinnedAnnouncements(): Announcement[] {
    return this.announcements.filter(a => a.isPinned);
  }

  get regularAnnouncements(): Announcement[] {
    return this.announcements.filter(a => !a.isPinned);
  }

  get canCreateAnnouncement(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'teacher';
  }

  canEdit(announcement: Announcement): boolean {
    if (this.currentUser?.role === 'admin') return true;
    return announcement.author === this.currentUser?._id;
  }

  canDelete(announcement: Announcement): boolean {
    if (this.currentUser?.role === 'admin') return true;
    return announcement.author === this.currentUser?._id;
  }

  getPriorityClass(priority: string): string {
    const classes: any = {
      urgent: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
      high: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
      normal: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      low: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
    };
    return classes[priority] || classes.normal;
  }

  getTypeClass(type: string): string {
    const classes: any = {
      emergency: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
      academic: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
      event: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      maintenance: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      holiday: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800',
      general: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
    };
    return classes[type] || classes.general;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Pagination methods
  nextPage(): void {
    if (this.pagination.page < this.pagination.pages) {
      this.pagination.page++;
      this.loadAnnouncements();
    }
  }

  previousPage(): void {
    if (this.pagination.page > 1) {
      this.pagination.page--;
      this.loadAnnouncements();
    }
  }

  goToPage(page: number): void {
    this.pagination.page = page;
    this.loadAnnouncements();
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(this.pagination.pages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}

