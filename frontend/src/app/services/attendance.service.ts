import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface AttendanceRecord {
  student: any;
  status: 'present' | 'absent' | 'late' | 'excused';
  minutesLate?: number;
  notes?: string;
  markedAt: Date;
  markedBy?: any;
}

export interface Attendance {
  _id: string;
  group: any;
  session: {
    date: Date;
    scheduleIndex: number;
  };
  teacher: any;
  subject: any;
  records: AttendanceRecord[];
  sessionNotes?: string;
  isCompleted: boolean;
  isLocked?: boolean;
  lockedAt?: Date;
  lockedBy?: any;
  createdBy?: any;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export interface AttendanceListResponse {
  attendances: Attendance[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiBaseUrl}/attendance`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('✅ AttendanceService initialized with URL:', this.apiUrl);
  }

  getAttendances(params: any = {}): Observable<AttendanceListResponse> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    console.log('📋 AttendanceService.getAttendances() - URL:', this.apiUrl, 'Params:', params);
    return this.http.get<AttendanceListResponse>(this.apiUrl, { 
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  getAttendance(id: string): Observable<Attendance> {
    console.log('📋 AttendanceService.getAttendance() - ID:', id);
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPendingAttendance(): Observable<{ success: boolean, pendingGroups: any[], count: number, today?: string, dayOfWeek?: string }> {
    console.log('📋 AttendanceService.getPendingAttendance() - URL:', `${this.apiUrl}/pending`);
    console.log('🔑 Auth headers being added:', this.authService.getAuthHeaders().keys());
    return this.http.get<{ success: boolean, pendingGroups: any[], count: number, today?: string, dayOfWeek?: string }>(`${this.apiUrl}/pending`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getGroupAttendance(groupId: string): Observable<{ attendances: Attendance[], stats: any }> {
    return this.http.get<{ attendances: Attendance[], stats: any }>(`${this.apiUrl}/group/${groupId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentAttendance(studentId: string): Observable<{ attendances: any[], stats: AttendanceStats }> {
    return this.http.get<{ attendances: any[], stats: AttendanceStats }>(`${this.apiUrl}/student/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getTeacherAttendance(teacherId: string): Observable<{ attendances: Attendance[] }> {
    return this.http.get<{ attendances: Attendance[] }>(`${this.apiUrl}/teacher/${teacherId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getAttendanceStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createAttendance(data: {
    groupId: string;
    sessionDate: Date;
    scheduleIndex: number;
    records: { studentId: string; status: string; notes?: string }[];
    sessionNotes?: string;
    isCompleted?: boolean;
  }): Observable<{ message: string; attendance: Attendance }> {
    return this.http.post<{ message: string; attendance: Attendance }>(this.apiUrl, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateAttendance(id: string, data: {
    records?: { studentId: string; status: string; minutesLate?: number; notes?: string }[];
    sessionNotes?: string;
    isCompleted?: boolean;
  }): Observable<{ message: string; attendance: Attendance }> {
    return this.http.put<{ message: string; attendance: Attendance }>(`${this.apiUrl}/${id}`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkUpdateAttendance(id: string, records: { 
    studentId: string; 
    status: string; 
    minutesLate?: number; 
    notes?: string 
  }[]): Observable<{ message: string; attendance: Attendance }> {
    return this.http.post<{ message: string; attendance: Attendance }>(`${this.apiUrl}/${id}/bulk-update`, { records }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  lockAttendance(id: string): Observable<{ message: string; attendance: Attendance }> {
    return this.http.post<{ message: string; attendance: Attendance }>(`${this.apiUrl}/${id}/lock`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  unlockAttendance(id: string): Observable<{ message: string; attendance: Attendance }> {
    return this.http.post<{ message: string; attendance: Attendance }>(`${this.apiUrl}/${id}/unlock`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  exportAttendance(params: { groupId?: string; dateFrom?: string; dateTo?: string; format?: 'json' | 'csv' }): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params]) {
        httpParams = httpParams.set(key, params[key as keyof typeof params] as string);
      }
    });
    
    if (params.format === 'csv') {
      return this.http.get(`${this.apiUrl}/reports/export`, { 
        params: httpParams, 
        responseType: 'blob' as 'json',
        headers: this.authService.getAuthHeaders()
      });
    }
    
    return this.http.get<{ data: any[]; count: number }>(`${this.apiUrl}/reports/export`, { 
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteAttendance(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
