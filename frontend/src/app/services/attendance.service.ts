import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
  student: any;
  status: 'present' | 'absent' | 'late' | 'excused';
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

  constructor(private http: HttpClient) {}

  getAttendances(params: any = {}): Observable<AttendanceListResponse> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get<AttendanceListResponse>(this.apiUrl, { params: httpParams });
  }

  getAttendance(id: string): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`);
  }

  getPendingAttendance(): Observable<{ pendingGroups: any[], count: number }> {
    return this.http.get<{ pendingGroups: any[], count: number }>(`${this.apiUrl}/pending`);
  }

  getGroupAttendance(groupId: string): Observable<{ attendances: Attendance[], stats: any }> {
    return this.http.get<{ attendances: Attendance[], stats: any }>(`${this.apiUrl}/group/${groupId}`);
  }

  getStudentAttendance(studentId: string): Observable<{ attendances: any[], stats: AttendanceStats }> {
    return this.http.get<{ attendances: any[], stats: AttendanceStats }>(`${this.apiUrl}/student/${studentId}`);
  }

  getTeacherAttendance(teacherId: string): Observable<{ attendances: Attendance[] }> {
    return this.http.get<{ attendances: Attendance[] }>(`${this.apiUrl}/teacher/${teacherId}`);
  }

  getAttendanceStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  createAttendance(data: {
    groupId: string;
    sessionDate: Date;
    scheduleIndex: number;
    records: { studentId: string; status: string; notes?: string }[];
    sessionNotes?: string;
    isCompleted?: boolean;
  }): Observable<{ message: string; attendance: Attendance }> {
    return this.http.post<{ message: string; attendance: Attendance }>(this.apiUrl, data);
  }

  updateAttendance(id: string, data: {
    records?: { studentId: string; status: string; notes?: string }[];
    sessionNotes?: string;
    isCompleted?: boolean;
  }): Observable<{ message: string; attendance: Attendance }> {
    return this.http.put<{ message: string; attendance: Attendance }>(`${this.apiUrl}/${id}`, data);
  }

  deleteAttendance(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
