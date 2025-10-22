import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface TeacherOverview {
  totalStudents: number;
  totalCourses: number;
  totalGroups: number;
  averageAttendanceRate: number;
  averageGrade: number;
  totalAssignments: number;
  pendingGrading: number;
  lateSubmissionRate: number;
  recentActivity: {
    submissions: number;
    graded: number;
    attendanceMarked: number;
  };
}

export interface CoursePerformance {
  courseId: string;
  courseName: string;
  totalStudents: number;
  averageGrade: number;
  attendanceRate: number;
  assignmentCount: number;
  submissionRate: number;
  gradeDistribution: {
    excellent: number; // 90-100
    good: number; // 75-89
    average: number; // 60-74
    poor: number; // 0-59
  };
  topStudents: Array<{
    studentId: string;
    studentName: string;
    averageGrade: number;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    studentName: string;
    averageGrade: number;
  }>;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  averageGrade: number;
  attendanceRate: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  submissionRate: number;
  lateSubmissions: number;
  gradeHistory: Array<{
    assignmentId: string;
    assignmentTitle: string;
    grade: number;
    maxPoints: number;
    submittedAt: Date;
  }>;
  attendanceHistory: Array<{
    date: Date;
    status: string;
    group: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly ANALYTICS_ENDPOINT = 'analytics';

  constructor(private api: ApiService) {}

  /**
   * Get teacher overview statistics
   */
  getTeacherOverview(teacherId?: string): Observable<ApiResponse<{ overview: TeacherOverview }>> {
    const params = teacherId ? { teacherId } : {};
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/teacher-overview`, params);
  }

  /**
   * Get performance metrics for a specific course
   */
  getCoursePerformance(courseId: string): Observable<ApiResponse<{ performance: CoursePerformance }>> {
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/course/${courseId}/performance`);
  }

  /**
   * Get performance metrics for a specific student
   */
  getStudentPerformance(studentId: string): Observable<ApiResponse<{ performance: StudentPerformance }>> {
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/student/${studentId}/performance`);
  }

  /**
   * Get grade distribution across all courses
   */
  getGradeDistribution(): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/grade-distribution`);
  }

  /**
   * Get attendance trends over time
   */
  getAttendanceTrends(startDate?: string, endDate?: string): Observable<ApiResponse<any>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/attendance-trends`, params);
  }

  /**
   * Get assignment completion rates
   */
  getAssignmentCompletion(): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ANALYTICS_ENDPOINT}/assignment-completion`);
  }
}

