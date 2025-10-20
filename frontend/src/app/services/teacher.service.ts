import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams, ApiResponse } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private readonly TEACHERS_ENDPOINT = 'teachers';

  constructor(private apiService: ApiService) { }

  getTeachers(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.apiService.get(this.TEACHERS_ENDPOINT, params);
  }

  getTeacher(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/${id}`);
  }

  createTeacher(teacherData: any): Observable<ApiResponse<any>> {
    return this.apiService.post(this.TEACHERS_ENDPOINT, teacherData);
  }

  updateTeacher(id: string, teacherData: any): Observable<ApiResponse<any>> {
    return this.apiService.put(this.TEACHERS_ENDPOINT, id, teacherData);
  }

  deleteTeacher(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(this.TEACHERS_ENDPOINT, id);
  }

  bulkAction(action: 'activate' | 'deactivate' | 'delete', teacherIds: string[]): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.TEACHERS_ENDPOINT}/bulk-action`, { action, teacherIds });
  }

  getTeacherCourses(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/${id}/courses`);
  }

  getTeacherAssignments(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/${id}/assignments`);
  }

  getTeacherStudents(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/${id}/students`);
  }

  addSubjects(id: string, subjectIds: string[]): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.TEACHERS_ENDPOINT}/${id}/subjects`, { subjectIds });
  }

  removeSubject(id: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`${this.TEACHERS_ENDPOINT}/${id}/subjects`, subjectId);
  }

  // Student-facing methods
  browseTeachers(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/browse`, params);
  }

  getTeacherCoursesForStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.TEACHERS_ENDPOINT}/${id}/courses`);
  }

  joinGroup(groupId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.TEACHERS_ENDPOINT}/groups/${groupId}/join`, {});
  }

  leaveGroup(groupId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.TEACHERS_ENDPOINT}/groups/${groupId}/leave`, {});
  }
}

