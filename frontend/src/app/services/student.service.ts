import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService, QueryParams, ApiResponse } from './api.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = environment.apiBaseUrl;
  private readonly STUDENTS_ENDPOINT = 'students';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  getStudents(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.apiService.getStudents(params);
  }

  getStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.getById(this.STUDENTS_ENDPOINT, id);
  }

  createStudent(studentData: any): Observable<ApiResponse<any>> {
    return this.apiService.post(this.STUDENTS_ENDPOINT, studentData);
  }

  updateStudent(id: string, studentData: any): Observable<ApiResponse<any>> {
    return this.apiService.put(this.STUDENTS_ENDPOINT, id, studentData);
  }

  deleteStudent(id: string): Observable<any> {
    return this.apiService.delete(this.STUDENTS_ENDPOINT, id);
  }

  // Bulk operations
  bulkAction(action: 'activate' | 'deactivate' | 'delete', studentIds: string[]): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.STUDENTS_ENDPOINT}/bulk-action`, { action, studentIds });
  }

  getStudentCourses(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.STUDENTS_ENDPOINT}/${id}/courses`);
  }

  getStudentGrades(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.STUDENTS_ENDPOINT}/${id}/grades`);
  }

  getStudentAttendance(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.STUDENTS_ENDPOINT}/${id}/attendance`);
  }
}