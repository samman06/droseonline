import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly GROUPS_ENDPOINT = 'groups';

  constructor(private api: ApiService) {}

  getGroups(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.api.get(this.GROUPS_ENDPOINT, params);
  }

  getGroup(id: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.GROUPS_ENDPOINT}/${id}`);
  }

  createGroup(payload: any): Observable<ApiResponse<any>> {
    return this.api.post(this.GROUPS_ENDPOINT, payload);
  }

  updateGroup(id: string, payload: any): Observable<ApiResponse<any>> {
    return this.api.put(this.GROUPS_ENDPOINT, id, payload);
  }

  deleteGroup(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.GROUPS_ENDPOINT, id);
  }

  toggleStatus(id: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.GROUPS_ENDPOINT}/${id}/toggle-status`, {});
  }

  addStudent(id: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.GROUPS_ENDPOINT}/${id}/students`, { studentId });
  }

  removeStudent(id: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.GROUPS_ENDPOINT}/${id}/students`, studentId);
  }

  checkScheduleConflict(courseId: string, schedule: any[], excludeGroupId?: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.GROUPS_ENDPOINT}/check-schedule-conflict`, {
      courseId,
      schedule,
      excludeGroupId
    });
  }

  // ==========================================
  // ROLE-SPECIFIC METHODS
  // ==========================================

  /**
   * Get groups for the current student (enrolled groups only)
   * Used by students to see their groups
   */
  getMyGroups(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.api.get(`${this.GROUPS_ENDPOINT}/my-groups`, params);
  }

  /**
   * Get groups taught by the current teacher
   * Used by teachers to see their teaching groups
   */
  getTeacherGroups(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.api.get(`${this.GROUPS_ENDPOINT}/teacher/groups`, params);
  }

  /**
   * Get all groups (admin view)
   * Alias for getGroups() for clarity in role-based code
   */
  getAllGroups(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.getGroups(params);
  }
}


