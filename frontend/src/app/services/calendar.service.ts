import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CalendarEvent {
  id: string;
  type: 'assignment' | 'quiz' | 'session' | 'announcement';
  title: string;
  description: string;
  date: Date;
  allDay: boolean;
  color: string;
  course?: string;
  groups?: string;
  group?: string;
  status?: string;
  priority?: string;
  author?: string;
  metadata?: any;
}

export interface CalendarQueryParams {
  month?: number;
  year?: number;
  view?: 'month' | 'week' | 'day' | 'list';
  type?: 'assignment' | 'quiz' | 'session' | 'announcement';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly CALENDAR_ENDPOINT = 'calendar';

  constructor(private apiService: ApiService) {}

  // Get calendar events for current user
  getMyCalendar(params: CalendarQueryParams = {}): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.CALENDAR_ENDPOINT}/my-calendar`, params);
  }

  // Get upcoming events (next 7 days)
  getUpcomingEvents(limit: number = 10): Observable<ApiResponse<CalendarEvent[]>> {
    return this.apiService.get(`${this.CALENDAR_ENDPOINT}/upcoming`, { limit });
  }

  // Helper: Get color for event type
  getEventColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'assignment': '#3B82F6', // blue
      'quiz': '#EF4444', // red
      'session': '#10B981', // green
      'announcement': '#FBBF24' // yellow
    };
    return colorMap[type] || '#6B7280'; // gray default
  }

  // Helper: Get icon for event type
  getEventIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'assignment': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'quiz': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      'session': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'announcement': 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
    };
    return iconMap[type] || iconMap['announcement'];
  }

  // Helper: Get display name for event type
  getEventTypeName(type: string): string {
    const nameMap: { [key: string]: string } = {
      'assignment': 'Assignment',
      'quiz': 'Quiz',
      'session': 'Class Session',
      'announcement': 'Announcement'
    };
    return nameMap[type] || type;
  }

  // Helper: Format time for display
  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Helper: Check if event is today
  isToday(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  // Helper: Check if event is upcoming (within next 7 days)
  isUpcoming(date: Date | string): boolean {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 7;
  }

  // Helper: Check if event is overdue
  isOverdue(date: Date | string): boolean {
    const d = new Date(date);
    const now = new Date();
    return d < now;
  }

  // Helper: Get days until event
  getDaysUntil(date: Date | string): number {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Helper: Get relative time string
  getRelativeTime(date: Date | string): string {
    const days = this.getDaysUntil(date);
    
    if (days < 0) {
      return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    } else if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Tomorrow';
    } else if (days <= 7) {
      return `In ${days} days`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }

  // Helper: Group events by date
  groupEventsByDate(events: CalendarEvent[]): { [key: string]: CalendarEvent[] } {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }

  // Helper: Get calendar days for month view
  getCalendarDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthDays = firstDay.getDay();
    const days: Date[] = [];
    
    // Add previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }

  // Helper: Get month name
  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  // Helper: Get day name
  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  // Helper: Export events to .ics file
  exportToICS(events: CalendarEvent[], filename: string = 'calendar.ics'): void {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Drose Online//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(event => {
      const start = new Date(event.date);
      const end = new Date(start.getTime() + (event.allDay ? 86400000 : 3600000)); // +1 day or +1 hour
      
      icsContent.push(
        'BEGIN:VEVENT',
        `DTSTART:${this.formatICSDate(start)}`,
        `DTEND:${this.formatICSDate(end)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `UID:${event.id}@droseonline.com`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // Helper: Format date for ICS file
  private formatICSDate(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n.toString();
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}

