import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly SUBJECTS_ENDPOINT = 'subjects';

  constructor(private api: ApiService) {}

  getSubjects(params: QueryParams = {}): Observable<ApiResponse<any>> {
    return this.api.get(this.SUBJECTS_ENDPOINT, params);
  }

  getSubject(id: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.SUBJECTS_ENDPOINT}/${id}`);
  }

  createSubject(payload: any): Observable<ApiResponse<any>> {
    return this.api.post(this.SUBJECTS_ENDPOINT, payload);
  }

  updateSubject(id: string, payload: any): Observable<ApiResponse<any>> {
    return this.api.put(this.SUBJECTS_ENDPOINT, id, payload);
  }

  deleteSubject(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.SUBJECTS_ENDPOINT, id);
  }

  activateSubject(id: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.SUBJECTS_ENDPOINT}/${id}/activate`, {});
  }

  deactivateSubject(id: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.SUBJECTS_ENDPOINT}/${id}/deactivate`, {});
  }

  bulkAction(action: 'activate' | 'deactivate', subjectIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.SUBJECTS_ENDPOINT}/bulk-action`, { action, subjectIds });
  }
}


