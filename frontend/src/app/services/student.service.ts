import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getStudents(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get<any>(`${this.API_URL}/students`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudent(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/students/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createStudent(studentData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/register`, studentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateStudent(id: string, studentData: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/students/${id}`, studentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentCourses(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/students/${id}/courses`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentGrades(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/students/${id}/grades`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentAttendance(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/students/${id}/attendance`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
