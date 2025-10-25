import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';
import { environment } from '../../environments/environment';

export interface Course {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  subject: string | any;
  teacher: string | any;
  groups: string[] | any[];
  academicYear: string | any;
  semester: 'fall' | 'spring' | 'summer';
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
  capacity?: number;
  currentEnrollment?: number;
  studentCount?: number;
  syllabus?: {
    overview?: string;
    objectives?: string[];
    topics?: string[];
    gradingPolicy?: string;
    materials?: any[];
  };
  settings?: {
    allowSelfEnrollment?: boolean;
    requireApproval?: boolean;
    isVisible?: boolean;
  };
  isActive: boolean;
  stats?: {
    totalStudents?: number;
    totalAssignments?: number;
    averageGrade?: number;
    attendanceRate?: number;
  };
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseEnrollment {
  student: string | any;
  course: string;
  enrolledAt: Date;
  status: 'active' | 'dropped' | 'completed' | 'withdrawn';
  grade?: {
    current?: number;
    final?: number;
    letterGrade?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly COURSES_ENDPOINT = 'courses';
  private readonly API_URL = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  // Course CRUD Operations
  getCourses(params: QueryParams = {}): Observable<ApiResponse<Course[]>> {
    return this.api.get(this.COURSES_ENDPOINT, params);
  }

  getCourse(id: string): Observable<ApiResponse<Course>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${id}`);
  }

  createCourse(payload: Partial<Course>): Observable<ApiResponse<Course>> {
    return this.api.post(this.COURSES_ENDPOINT, payload);
  }

  updateCourse(id: string, payload: Partial<Course>): Observable<ApiResponse<Course>> {
    return this.api.put(this.COURSES_ENDPOINT, id, payload);
  }

  deleteCourse(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.COURSES_ENDPOINT, id);
  }

  // Course Status Management
  activateCourse(id: string): Observable<ApiResponse<Course>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${id}/activate`, {});
  }

  deactivateCourse(id: string): Observable<ApiResponse<Course>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${id}/deactivate`, {});
  }

  toggleCourseStatus(id: string): Observable<ApiResponse<Course>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${id}/toggle-status`, {});
  }

  // Student Enrollment
  enrollStudent(courseId: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${courseId}/enroll`, { studentId });
  }

  unenrollStudent(courseId: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${courseId}/unenroll`, { studentId });
  }

  bulkEnroll(courseId: string, studentIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${courseId}/bulk-enroll`, { studentIds });
  }

  // Group Management
  addGroup(courseId: string, groupId: string): Observable<ApiResponse<Course>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${courseId}/groups`, { groupId });
  }

  removeGroup(courseId: string, groupId: string): Observable<ApiResponse<Course>> {
    return this.api.delete(`${this.COURSES_ENDPOINT}/${courseId}/groups`, groupId);
  }

  // Course Content and Resources
  getCourseStudents(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/students`, params);
  }

  getCourseAssignments(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/assignments`, params);
  }

  getCourseAnnouncements(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/announcements`, params);
  }

  getCourseAttendance(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/attendance`, params);
  }

  getCourseMaterials(courseId: string): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/materials`);
  }

  addCourseMaterial(courseId: string, material: any): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/${courseId}/materials`, material);
  }

  deleteCourseMaterial(courseId: string, materialId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.COURSES_ENDPOINT}/${courseId}/materials`, materialId);
  }

  // Syllabus Management
  updateSyllabus(courseId: string, syllabus: any): Observable<ApiResponse<Course>> {
    return this.api.put(`${this.COURSES_ENDPOINT}/${courseId}/syllabus`, '', syllabus);
  }

  getSyllabus(courseId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/syllabus`);
  }

  // Statistics and Analytics
  getCourseStats(courseId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/stats`);
  }

  getCourseGrades(courseId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.COURSES_ENDPOINT}/${courseId}/grades`, params);
  }

  // Filtering and Search
  getTeacherCourses(teacherId: string, params: QueryParams = {}): Observable<ApiResponse<Course[]>> {
    return this.api.get(this.COURSES_ENDPOINT, { ...params, teacherId });
  }

  getStudentCourses(studentId: string, params: QueryParams = {}): Observable<ApiResponse<Course[]>> {
    return this.api.get(this.COURSES_ENDPOINT, { ...params, studentId });
  }

  getCoursesBySubject(subjectId: string, params: QueryParams = {}): Observable<ApiResponse<Course[]>> {
    return this.api.get(this.COURSES_ENDPOINT, { ...params, subjectId });
  }

  getCoursesByAcademicYear(academicYearId: string, params: QueryParams = {}): Observable<ApiResponse<Course[]>> {
    return this.api.get(this.COURSES_ENDPOINT, { ...params, academicYear: academicYearId });
  }

  // Bulk Operations
  bulkActivate(courseIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/bulk-activate`, { courseIds });
  }

  bulkDeactivate(courseIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/bulk-deactivate`, { courseIds });
  }

  bulkDelete(courseIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.COURSES_ENDPOINT}/bulk-delete`, { courseIds });
  }

  // Export Functionality
  exportCourseRoster(courseId: string, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${this.COURSES_ENDPOINT}/${courseId}/export-roster`, {
      params: { format },
      responseType: 'blob'
    });
  }

  exportCourseGrades(courseId: string, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${this.COURSES_ENDPOINT}/${courseId}/export-grades`, {
      params: { format },
      responseType: 'blob'
    });
  }
}

