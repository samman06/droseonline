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

  addStudent(id: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.GROUPS_ENDPOINT}/${id}/students`, { studentId });
  }

  removeStudent(id: string, studentId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.GROUPS_ENDPOINT}/${id}/students`, studentId);
  }
}


