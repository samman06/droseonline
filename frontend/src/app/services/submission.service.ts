import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';
import { environment } from '../../environments/environment';

export interface SubmissionFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface RubricGrade {
  criteria: string;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
}

export interface Grade {
  pointsEarned: number;
  maxPoints: number;
  percentage: number;
  letterGrade?: string;
  feedback?: string;
  rubricGrades?: RubricGrade[];
  gradedBy?: string | any;
  gradedAt?: Date;
}

export interface Submission {
  _id?: string;
  assignment: string | any;
  student: string | any;
  status: 'draft' | 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  content?: {
    text?: string;
    links?: string[];
    files?: SubmissionFile[];
  };
  grade?: Grade;
  submittedAt?: Date;
  attempts?: number;
  latePenalty?: number;
  comments?: {
    user: string | any;
    content: string;
    createdAt: Date;
  }[];
  version?: number;
  previousSubmissions?: string[];
  plagiarismScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubmissionStats {
  total: number;
  submitted: number;
  graded: number;
  pending: number;
  late: number;
  averageGrade: number;
  highestGrade: number;
  lowestGrade: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private readonly SUBMISSIONS_ENDPOINT = 'submissions';
  private readonly GRADES_ENDPOINT = 'grades';
  private readonly API_URL = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  // Submission CRUD Operations
  getSubmissions(params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(this.SUBMISSIONS_ENDPOINT, params);
  }

  getSubmission(id: string): Observable<ApiResponse<Submission>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/${id}`);
  }

  createSubmission(assignmentId: string, payload: Partial<Submission>): Observable<ApiResponse<Submission>> {
    return this.api.post(`assignments/${assignmentId}/submit`, payload);
  }

  updateSubmission(id: string, payload: Partial<Submission>): Observable<ApiResponse<Submission>> {
    return this.api.put(this.SUBMISSIONS_ENDPOINT, id, payload);
  }

  deleteSubmission(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.SUBMISSIONS_ENDPOINT, id);
  }

  // Student Submission Operations
  getMySubmissions(params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/my-submissions`, params);
  }

  getMySubmission(assignmentId: string): Observable<ApiResponse<Submission>> {
    return this.api.get(`assignments/${assignmentId}/my-submission`);
  }

  submitAssignment(assignmentId: string, content: {
    text?: string;
    links?: string[];
    files?: File[];
  }): Observable<ApiResponse<Submission>> {
    const formData = new FormData();
    
    if (content.text) {
      formData.append('text', content.text);
    }
    
    if (content.links) {
      content.links.forEach((link, index) => {
        formData.append(`links[${index}]`, link);
      });
    }
    
    if (content.files) {
      content.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return this.api.post(`assignments/${assignmentId}/submit`, formData);
  }

  resubmitAssignment(submissionId: string, content: any): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/resubmit`, content);
  }

  saveDraft(assignmentId: string, content: any): Observable<ApiResponse<Submission>> {
    return this.api.post(`assignments/${assignmentId}/save-draft`, content);
  }

  // File Management
  uploadFile(assignmentId: string, file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`assignments/${assignmentId}/upload`, formData);
  }

  deleteFile(submissionId: string, fileId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/files`, fileId);
  }

  downloadSubmissionFiles(submissionId: string): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/${this.SUBMISSIONS_ENDPOINT}/${submissionId}/download`,
      { responseType: 'blob' }
    );
  }

  // Assignment Submissions (Teacher View)
  getAssignmentSubmissions(assignmentId: string, params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`assignments/${assignmentId}/submissions`, params);
  }

  getSubmissionsByStatus(assignmentId: string, status: string): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`assignments/${assignmentId}/submissions`, { status });
  }

  getPendingSubmissions(params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(this.SUBMISSIONS_ENDPOINT, { ...params, status: 'submitted' });
  }

  // Grading Operations
  gradeSubmission(submissionId: string, gradeData: {
    pointsEarned: number;
    feedback?: string;
    rubricGrades?: RubricGrade[];
  }): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.GRADES_ENDPOINT}/${submissionId}`, gradeData);
  }

  updateGrade(submissionId: string, gradeData: Partial<Grade>): Observable<ApiResponse<Submission>> {
    return this.api.put(`${this.GRADES_ENDPOINT}`, submissionId, gradeData);
  }

  releaseGrade(submissionId: string): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.GRADES_ENDPOINT}/${submissionId}/release`, {});
  }

  bulkGrade(submissionIds: string[], gradeData: any): Observable<ApiResponse<any>> {
    return this.api.post(`${this.GRADES_ENDPOINT}/bulk`, { submissionIds, gradeData });
  }

  // Comments
  addComment(submissionId: string, content: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/comments`, { content });
  }

  getComments(submissionId: string): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/comments`);
  }

  deleteComment(submissionId: string, commentId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/comments`, commentId);
  }

  // Student Grades
  getMyGrades(params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`${this.GRADES_ENDPOINT}/my-grades`, params);
  }

  getStudentGrades(studentId: string, params: QueryParams = {}): Observable<ApiResponse<Submission[]>> {
    return this.api.get(`${this.GRADES_ENDPOINT}/student/${studentId}`, params);
  }

  getCourseGrades(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.api.get(`courses/${courseId}/grades`, params);
  }

  // Statistics
  getSubmissionStats(assignmentId: string): Observable<ApiResponse<SubmissionStats>> {
    return this.api.get(`assignments/${assignmentId}/submission-stats`);
  }

  getStudentSubmissionStats(studentId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/student/${studentId}/stats`);
  }

  // Plagiarism Check
  checkPlagiarism(submissionId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/plagiarism-check`, {});
  }

  // Export and Download
  exportGrades(assignmentId: string, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/assignments/${assignmentId}/export-grades`,
      { params: { format }, responseType: 'blob' }
    );
  }

  downloadGradebook(courseId: string, format: 'csv' | 'excel' = 'excel'): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/courses/${courseId}/gradebook`,
      { params: { format }, responseType: 'blob' }
    );
  }

  // Batch Operations
  downloadAllSubmissions(assignmentId: string): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/assignments/${assignmentId}/download-all-submissions`,
      { responseType: 'blob' }
    );
  }

  bulkDownloadSubmissions(submissionIds: string[]): Observable<Blob> {
    return this.http.post(
      `${this.API_URL}/${this.SUBMISSIONS_ENDPOINT}/bulk-download`,
      { submissionIds },
      { responseType: 'blob' }
    );
  }

  // Late Submissions
  allowLateSubmission(submissionId: string): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/allow-late`, {});
  }

  waiveLatePenalty(submissionId: string): Observable<ApiResponse<Submission>> {
    return this.api.post(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/waive-penalty`, {});
  }

  // Submission History
  getSubmissionHistory(submissionId: string): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/history`);
  }

  getPreviousVersion(submissionId: string, version: number): Observable<ApiResponse<Submission>> {
    return this.api.get(`${this.SUBMISSIONS_ENDPOINT}/${submissionId}/version/${version}`);
  }
}

