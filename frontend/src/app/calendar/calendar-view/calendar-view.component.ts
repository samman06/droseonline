import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">📅 {{ 'calendar.myCalendar' | translate }}</h1>
              <p class="text-purple-100 text-lg">{{ 'calendar.subtitle' | translate }}</p>
            </div>
            <div class="mt-4 md:mt-0 flex gap-2">
              <button (click)="exportCalendar()"
                      class="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {{ 'calendar.export' | translate }}
              </button>
              <button (click)="goToToday()"
                      class="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all shadow-lg font-semibold">
                {{ 'calendar.today' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar Controls -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Month Navigation -->
            <div class="flex items-center gap-4">
              <button (click)="previousMonth()"
                      class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h2 class="text-2xl font-bold text-gray-900 min-w-[200px] text-center">
                {{ calendarService.getMonthName(currentMonth) }} {{ currentYear }}
              </h2>
              <button (click)="nextMonth()"
                      class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>

            <!-- View Toggle & Filters -->
            <div class="flex items-center gap-4">
              <!-- Type Filter -->
              <select [(ngModel)]="selectedType"
                      (change)="loadCalendar()"
                      class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">{{ 'calendar.allTypes' | translate }}</option>
                <option value="assignment">{{ 'calendar.assignments' | translate }}</option>
                <option value="quiz">{{ 'calendar.quizzes' | translate }}</option>
                <option value="session">{{ 'calendar.sessions' | translate }}</option>
                <option value="announcement">{{ 'calendar.announcements' | translate }}</option>
              </select>

              <!-- View Mode -->
              <div class="flex bg-gray-100 rounded-lg p-1">
                <button (click)="viewMode = 'month'; loadCalendar()"
                        [class]="viewMode === 'month' ? 'px-4 py-2 bg-white rounded-md shadow-sm text-purple-600 font-medium' : 'px-4 py-2 text-gray-600'">
                  {{ 'calendar.month' | translate }}
                </button>
                <button (click)="viewMode = 'list'; loadCalendar()"
                        [class]="viewMode === 'list' ? 'px-4 py-2 bg-white rounded-md shadow-sm text-purple-600 font-medium' : 'px-4 py-2 text-gray-600'">
                  {{ 'calendar.list' | translate }}
                </button>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div *ngIf="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span class="text-sm font-medium text-gray-700">{{ stats.assignments }} {{ 'calendar.assignments' | translate }}</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <span class="text-sm font-medium text-gray-700">{{ stats.quizzes }} {{ 'calendar.quizzes' | translate }}</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-sm font-medium text-gray-700">{{ stats.sessions }} {{ 'calendar.sessions' | translate }}</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span class="text-sm font-medium text-gray-700">{{ stats.announcements }} {{ 'calendar.announcements' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">{{ 'calendar.loadingCalendar' | translate }}</p>
        </div>

        <!-- Month View -->
        <div *ngIf="!loading && viewMode === 'month'" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Day Headers -->
          <div class="grid grid-cols-7 bg-gray-50 border-b">
            <div *ngFor="let day of getDayNames()"
                 class="p-4 text-center text-sm font-semibold text-gray-700">
              {{ day }}
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-grid grid grid-cols-7 divide-x divide-y">
            <div *ngFor="let day of calendarDays"
                 class="min-h-[120px] p-2 hover:bg-gray-50 transition-colors"
                 [class.bg-gray-50]="!isSameMonth(day)"
                 [class.bg-blue-50]="isToday(day)">
              
              <!-- Day Number -->
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold"
                      [class.text-gray-400]="!isSameMonth(day)"
                      [class.text-blue-600]="isToday(day)">
                  {{ day.getDate() }}
                </span>
                <span *ngIf="getEventsForDay(day).length > 0"
                      class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  {{ getEventsForDay(day).length }}
                </span>
              </div>

              <!-- Events -->
              <div class="space-y-1">
                <div *ngFor="let event of getEventsForDay(day).slice(0, 3)"
                     (click)="viewEventDetails(event)"
                     class="event-text text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                     [style.backgroundColor]="event.color + '20'"
                     [style.borderLeft]="'3px solid ' + event.color">
                  <div class="font-medium truncate">{{ event.title }}</div>
                  <div class="text-gray-600 truncate">{{ event.allDay ? ('calendar.allDay' | translate) : calendarService.formatTime(event.date) }}</div>
                </div>
                <div *ngIf="getEventsForDay(day).length > 3"
                     class="text-xs text-purple-600 font-medium cursor-pointer hover:underline"
                     (click)="showMoreEvents(day)">
                  +{{ getEventsForDay(day).length - 3 }} {{ 'calendar.more' | translate }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="!loading && viewMode === 'list'">
          <!-- Empty State -->
          <div *ngIf="events.length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ 'calendar.noEvents' | translate }}</h3>
            <p class="text-gray-500">{{ 'calendar.noEventsMessage' | translate }}</p>
          </div>

          <!-- Events List -->
          <div *ngIf="events.length > 0" class="space-y-4">
            <div *ngFor="let event of events"
                 class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4"
                 [style.borderColor]="event.color">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Event Type Badge -->
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3"
                        [style.backgroundColor]="event.color + '20'"
                        [style.color]="event.color">
                    {{ calendarService.getEventTypeName(event.type) }}
                  </span>

                  <!-- Event Title -->
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ event.title }}</h3>
                  
                  <!-- Event Description -->
                  <p class="text-gray-600 mb-4">{{ event.description }}</p>

                  <!-- Event Details -->
                  <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {{ event.date | date:'fullDate' }}
                    </div>
                    <div *ngIf="!event.allDay" class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {{ calendarService.formatTime(event.date) }}
                    </div>
                    <div *ngIf="event.course" class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      {{ event.course }}
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="ml-4">
                  <button (click)="viewEventDetails(event)"
                          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                    {{ 'calendar.viewDetails' | translate }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Events Modal -->
    <div *ngIf="showModal" 
         class="fixed inset-0 z-[9999] overflow-y-auto"
         (click)="closeModal()">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
             (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold text-white">
                  {{ 'calendar.eventsOn' | translate }} {{ modalDate | date:'fullDate' }}
                </h3>
                <p class="text-purple-100 text-sm mt-1">{{ modalEvents.length }} {{ 'calendar.events' | translate }}</p>
              </div>
              <button (click)="closeModal()" 
                      class="text-white hover:text-gray-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div class="space-y-3">
              <div *ngFor="let event of modalEvents"
                   class="border-l-4 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gray-50"
                   [style.borderColor]="event.color"
                   (click)="viewEventDetails(event)">
                
                <!-- Event Type Badge -->
                <div class="flex items-start justify-between mb-2">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        [style.backgroundColor]="event.color + '20'"
                        [style.color]="event.color">
                    {{ calendarService.getEventTypeName(event.type) }}
                  </span>
                  <span *ngIf="!event.allDay" class="text-sm text-gray-500">
                    {{ calendarService.formatTime(event.date) }}
                  </span>
                </div>

                <!-- Event Title -->
                <h4 class="text-lg font-semibold text-gray-900 mb-1">{{ event.title }}</h4>

                <!-- Event Description -->
                <p *ngIf="event.description" class="text-sm text-gray-600 mb-2">{{ event.description }}</p>

                <!-- Event Meta -->
                <div class="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                  <span *ngIf="event.course" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    {{ event.course }}
                  </span>
                  <span *ngIf="event.group" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    {{ event.group }}
                  </span>
                  <span *ngIf="event.allDay" class="flex items-center gap-1 text-purple-600 font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ 'calendar.allDay' | translate }}
                  </span>
                </div>

                <!-- Click to view indicator -->
                <div class="mt-3 text-xs text-purple-600 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                  {{ 'calendar.clickToViewDetails' | translate }}
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end">
            <button (click)="closeModal()"
                    class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              {{ 'common.close' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* RTL Support for Calendar */
    
    /* Calendar grid maintains LTR for week layout (Sun-Sat order) */
    .calendar-grid {
      direction: ltr;
    }
    
    /* Event text respects RTL */
    :host-context([dir="rtl"]) .event-text {
      direction: rtl;
      text-align: right;
    }
    
    /* Day headers maintain LTR order but text can be RTL */
    :host-context([dir="rtl"]) .calendar-grid > div {
      text-align: center;
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  viewMode: 'month' | 'list' = 'month';
  selectedType: '' | 'assignment' | 'quiz' | 'session' | 'announcement' = '';
  
  events: CalendarEvent[] = [];
  eventsByDate: { [key: string]: CalendarEvent[] } = {};
  calendarDays: Date[] = [];
  loading = false;
  stats: any = null;
  
  // Modal state
  showModal = false;
  modalDate: Date | null = null;
  modalEvents: CalendarEvent[] = [];

  constructor(
    public calendarService: CalendarService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.loading = true;
    
    const params = {
      month: this.currentMonth + 1,
      year: this.currentYear,
      view: this.viewMode,
      ...(this.selectedType && { type: this.selectedType })
    };

    this.calendarService.getMyCalendar(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events = response.data.events || [];
          this.eventsByDate = response.data.eventsByDate || {};
          this.stats = response.data.stats || null;
          
          if (this.viewMode === 'month') {
            this.calendarDays = this.calendarService.getCalendarDays(this.currentYear, this.currentMonth);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendar:', error);
        this.toastService.error(error.error?.userMessage || 'Failed to load calendar');
        this.loading = false;
      }
    });
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.loadCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSameMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth;
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    const dateKey = date.toISOString().split('T')[0];
    return this.eventsByDate[dateKey] || [];
  }

  viewEventDetails(event: CalendarEvent): void {
    // Navigate based on event type
    switch (event.type) {
      case 'assignment':
      case 'quiz':
        this.router.navigate(['/dashboard/assignments', event.id]);
        break;
      case 'announcement':
        this.router.navigate(['/dashboard/announcements', event.id]);
        break;
      case 'session':
        if (event.metadata?.groupId) {
          this.router.navigate(['/dashboard/groups', event.metadata.groupId]);
        }
        break;
    }
  }

  showMoreEvents(date: Date): void {
    this.modalDate = date;
    this.modalEvents = this.getEventsForDay(date);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalDate = null;
    this.modalEvents = [];
  }

  exportCalendar(): void {
    this.calendarService.exportToICS(this.events, `calendar_${this.currentMonth + 1}_${this.currentYear}.ics`);
    this.toastService.success(this.translate.instant('calendar.exportedSuccessfully'));
  }

  getDayNames(): string[] {
    return [
      this.translate.instant('calendar.sun'),
      this.translate.instant('calendar.mon'),
      this.translate.instant('calendar.tue'),
      this.translate.instant('calendar.wed'),
      this.translate.instant('calendar.thu'),
      this.translate.instant('calendar.fri'),
      this.translate.instant('calendar.sat')
    ];
  }
}

