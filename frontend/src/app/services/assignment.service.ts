import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';
import { environment } from '../../environments/environment';

export interface Assignment {
  _id?: string;
  code?: string;
  title: string;
  description: string;
  instructions?: string;
  course: string;
  teacher: string;
  groups: string[];
  type: 'homework' | 'quiz' | 'midterm' | 'final' | 'project' | 'presentation' | 'lab' | 'essay' | 'other';
  category: 'individual' | 'group' | 'pair';
  maxPoints: number;
  weightage: number;
  assignedDate: Date;
  dueDate: Date;
  lateSubmissionDeadline?: Date;
  submissionType: 'file' | 'text' | 'link' | 'quiz' | 'multiple';
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  allowLateSubmission: boolean;
  latePenalty?: number;
  status: 'draft' | 'published' | 'closed' | 'graded';
  resources?: any[];
  questions?: any[];
  rubric?: any[];
  stats?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Submission {
  _id?: string;
  assignment: string;
  student: string;
  submittedAt?: Date;
  status: 'draft' | 'submitted' | 'late' | 'graded' | 'returned';
  content?: {
    text?: string;
    links?: string[];
    files?: any[];
  };
  grade?: {
    pointsEarned?: number;
    percentage?: number;
    feedback?: string;
    rubricGrades?: any[];
    gradedBy?: string;
    gradedAt?: Date;
  };
  attempts?: number;
  latePenalty?: number;
  comments?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly ASSIGNMENTS_ENDPOINT = 'assignments';
  private readonly API_URL = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  // Assignment CRUD Operations
  getAssignments(params: QueryParams = {}): Observable<ApiResponse<Assignment[]>> {
    return this.api.get(this.ASSIGNMENTS_ENDPOINT, params);
  }

  getAssignment(id: string): Observable<ApiResponse<Assignment>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}/${id}`);
  }

  createAssignment(payload: Partial<Assignment>): Observable<ApiResponse<Assignment>> {
    return this.api.post(this.ASSIGNMENTS_ENDPOINT, payload);
  }

  updateAssignment(id: string, payload: Partial<Assignment>): Observable<ApiResponse<Assignment>> {
    return this.api.put(this.ASSIGNMENTS_ENDPOINT, id, payload);
  }

  deleteAssignment(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.ASSIGNMENTS_ENDPOINT, id);
  }

  // Bulk Operations
  bulkDeleteAssignments(assignmentIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${this.ASSIGNMENTS_ENDPOINT}/bulk-delete`, { assignmentIds });
  }

  bulkPublishAssignments(assignmentIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${this.ASSIGNMENTS_ENDPOINT}/bulk-publish`, { assignmentIds });
  }

  bulkCloseAssignments(assignmentIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${this.ASSIGNMENTS_ENDPOINT}/bulk-close`, { assignmentIds });
  }

  cloneAssignment(id: string): Observable<ApiResponse<Assignment>> {
    return this.http.post<ApiResponse<Assignment>>(`${this.API_URL}/${this.ASSIGNMENTS_ENDPOINT}/${id}/clone`, {});
  }

  // Assignment Status Management
  publishAssignment(id: string): Observable<ApiResponse<Assignment>> {
    return this.api.post(`${this.ASSIGNMENTS_ENDPOINT}/${id}/publish`, {});
  }

  closeAssignment(id: string): Observable<ApiResponse<Assignment>> {
    return this.api.post(`${this.ASSIGNMENTS_ENDPOINT}/${id}/close`, {});
  }

  reopenAssignment(id: string): Observable<ApiResponse<Assignment>> {
    return this.api.post(`${this.ASSIGNMENTS_ENDPOINT}/${id}/reopen`, {});
  }

  // Submission Operations
  getSubmissions(assignmentId: string, params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/submissions`, params);
  }

  getSubmission(assignmentId: string, submissionId: string): Observable<ApiResponse<Submission>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/submissions/${submissionId}`);
  }

  getMySubmission(assignmentId: string): Observable<ApiResponse<Submission>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/my-submission`);
  }

  submitAssignment(assignmentId: string, payload: any): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/submit`, payload);
  }

  updateSubmission(assignmentId: string, submissionId: string, payload: any): Observable<ApiResponse<Submission>> {
    return this.api.put(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/submissions`, submissionId, payload);
  }

  deleteSubmission(assignmentId: string, submissionId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/submissions`, submissionId);
  }

  // Grading Operations
  gradeSubmission(submissionId: string, gradeData: {
    pointsEarned: number;
    feedback?: string;
    rubricGrades?: any[];
  }): Observable<ApiResponse<Submission>> {
    return this.api.post(`grades/${submissionId}`, gradeData);
  }

  bulkGrade(submissionIds: string[], gradeData: any): Observable<ApiResponse<any>> {
    return this.api.post('grades/bulk', { submissionIds, gradeData });
  }

  // Statistics and Analytics
  getAssignmentStats(assignmentId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/stats`);
  }

  getStudentAssignments(studentId: string, params: QueryParams = {}): Observable<ApiResponse<Assignment[]>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}`, { ...params, studentId });
  }

  getTeacherAssignments(teacherId: string, params: QueryParams = {}): Observable<ApiResponse<Assignment[]>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}`, { ...params, teacherId });
  }

  getCourseAssignments(courseId: string, params: QueryParams = {}): Observable<ApiResponse<Assignment[]>> {
    return this.api.get(`${this.ASSIGNMENTS_ENDPOINT}`, { ...params, courseId });
  }

  // File Upload for Submissions (if implemented)
  uploadSubmissionFile(assignmentId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/upload`, formData);
  }

  // Export Functionality
  exportAssignmentGrades(assignmentId: string, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${this.ASSIGNMENTS_ENDPOINT}/${assignmentId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
}

