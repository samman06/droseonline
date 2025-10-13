import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';
import { environment } from '../../environments/environment';

export interface AcademicYear {
  _id?: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  semesters?: {
    name: string;
    code: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }[];
  settings?: {
    allowEnrollment?: boolean;
    allowGradeSubmission?: boolean;
    isArchived?: boolean;
  };
  stats?: {
    totalStudents?: number;
    totalCourses?: number;
    totalGroups?: number;
  };
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Semester {
  _id?: string;
  academicYear: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicYearService {
  private readonly ACADEMIC_YEARS_ENDPOINT = 'academic-years';
  private readonly API_URL = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  // Academic Year CRUD Operations
  getAcademicYears(params: QueryParams = {}): Observable<ApiResponse<AcademicYear[]>> {
    return this.api.get(this.ACADEMIC_YEARS_ENDPOINT, params);
  }

  getAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}`);
  }

  createAcademicYear(payload: Partial<AcademicYear>): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(this.ACADEMIC_YEARS_ENDPOINT, payload);
  }

  updateAcademicYear(id: string, payload: Partial<AcademicYear>): Observable<ApiResponse<AcademicYear>> {
    return this.api.put(this.ACADEMIC_YEARS_ENDPOINT, id, payload);
  }

  deleteAcademicYear(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.ACADEMIC_YEARS_ENDPOINT, id);
  }

  // Current Academic Year Management
  getCurrentAcademicYear(): Observable<ApiResponse<AcademicYear>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/current`);
  }

  setCurrentAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/set-current`, {});
  }

  // Semester Management
  getSemesters(academicYearId: string): Observable<ApiResponse<Semester[]>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters`);
  }

  addSemester(academicYearId: string, semester: Partial<Semester>): Observable<ApiResponse<Semester>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters`, semester);
  }

  updateSemester(academicYearId: string, semesterId: string, semester: Partial<Semester>): Observable<ApiResponse<Semester>> {
    return this.api.put(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters`, semesterId, semester);
  }

  deleteSemester(academicYearId: string, semesterId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters`, semesterId);
  }

  activateSemester(academicYearId: string, semesterId: string): Observable<ApiResponse<Semester>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters/${semesterId}/activate`, {});
  }

  deactivateSemester(academicYearId: string, semesterId: string): Observable<ApiResponse<Semester>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${academicYearId}/semesters/${semesterId}/deactivate`, {});
  }

  // Archive Management
  archiveAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/archive`, {});
  }

  unarchiveAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/unarchive`, {});
  }

  getArchivedAcademicYears(params: QueryParams = {}): Observable<ApiResponse<AcademicYear[]>> {
    return this.api.get(this.ACADEMIC_YEARS_ENDPOINT, { ...params, archived: true });
  }

  // Statistics
  getAcademicYearStats(id: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/stats`);
  }

  getAcademicYearCourses(id: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/courses`, params);
  }

  getAcademicYearGroups(id: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/groups`, params);
  }

  getAcademicYearStudents(id: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/students`, params);
  }

  // Settings Management
  updateSettings(id: string, settings: any): Observable<ApiResponse<AcademicYear>> {
    return this.api.put(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/settings`, '', settings);
  }

  toggleEnrollment(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/toggle-enrollment`, {});
  }

  toggleGradeSubmission(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/${id}/toggle-grade-submission`, {});
  }

  // Bulk Operations
  bulkArchive(academicYearIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/bulk-archive`, { academicYearIds });
  }

  bulkDelete(academicYearIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ACADEMIC_YEARS_ENDPOINT}/bulk-delete`, { academicYearIds });
  }

  // Utilities
  getActiveAcademicYears(params: QueryParams = {}): Observable<ApiResponse<AcademicYear[]>> {
    return this.api.get(this.ACADEMIC_YEARS_ENDPOINT, { ...params, archived: false });
  }

  getUpcomingAcademicYears(): Observable<ApiResponse<AcademicYear[]>> {
    const today = new Date().toISOString();
    return this.api.get(this.ACADEMIC_YEARS_ENDPOINT, { 
      startDate: { $gt: today },
      sort: 'startDate'
    });
  }

  getPastAcademicYears(params: QueryParams = {}): Observable<ApiResponse<AcademicYear[]>> {
    const today = new Date().toISOString();
    return this.api.get(this.ACADEMIC_YEARS_ENDPOINT, {
      ...params,
      endDate: { $lt: today },
      sort: '-endDate'
    });
  }

  // Export
  exportAcademicYearReport(id: string, format: 'csv' | 'excel' | 'pdf' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${this.ACADEMIC_YEARS_ENDPOINT}/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
}

