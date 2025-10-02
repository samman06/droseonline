import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService, QueryParams, ApiResponse } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  getStudents(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.apiService.getStudents(params);
  }

  getStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.getById('students', id);
  }

  createStudent(studentData: any): Observable<ApiResponse<any>> {
    return this.apiService.post('auth/register', studentData);
  }

  updateStudent(id: string, studentData: any): Observable<ApiResponse<any>> {
    return this.apiService.put('students', id, studentData);
  }

  deleteStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete('students', id);
  }

  getStudentCourses(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${id}/courses`);
  }

  getStudentAssignments(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${id}/assignments`);
  }

  getStudentGrades(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${id}/grades`);
  }

  getStudentAttendance(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`students/${id}/attendance`);
  }
}