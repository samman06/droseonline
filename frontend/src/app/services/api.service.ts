import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  filter?: any;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Generic GET method for listing data
  get<T>(endpoint: string, params?: QueryParams): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    console.log(`Making GET request to: ${this.API_URL}/${endpoint}`);
    console.log('With params:', params);

    return this.http.get<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`GET ${endpoint} response:`, response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Generic GET method for single item
  getById<T>(endpoint: string, id: string): Observable<ApiResponse<T>> {
    console.log(`Making GET request to: ${this.API_URL}/${endpoint}/${id}`);
    
    return this.http.get<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`GET ${endpoint}/${id} response:`, response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Generic POST method
  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    console.log(`Making POST request to: ${this.API_URL}/${endpoint}`);
    console.log('With data:', data);

    return this.http.post<ApiResponse<T>>(`${this.API_URL}/${endpoint}`, data, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`POST ${endpoint} response:`, response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Generic PUT method
  put<T>(endpoint: string, id: string, data: any): Observable<ApiResponse<T>> {
    console.log(`Making PUT request to: ${this.API_URL}/${endpoint}/${id}`);
    console.log('With data:', data);

    return this.http.put<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`, data, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`PUT ${endpoint}/${id} response:`, response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Generic DELETE method
  delete<T>(endpoint: string, id: string): Observable<ApiResponse<T>> {
    console.log(`Making DELETE request to: ${this.API_URL}/${endpoint}/${id}`);

    return this.http.delete<ApiResponse<T>>(`${this.API_URL}/${endpoint}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`DELETE ${endpoint}/${id} response:`, response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Specific methods for common endpoints
  getStudents(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('students', params);
  }

  getTeachers(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('teachers', params);
  }

  getSubjects(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('subjects', params);
  }

  getCourses(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('courses', params);
  }

  getGroups(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('groups', params);
  }

  getAssignments(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('assignments', params);
  }

  getAttendance(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('attendance', params);
  }

  getAnnouncements(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.get('announcements', params);
  }

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.get('dashboard/stats');
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized - Please log in again';
        // Optionally redirect to login
        this.authService.logout();
      } else if (error.status === 403) {
        errorMessage = 'Forbidden - You do not have permission to access this resource';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error - Please try again later';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Processed error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
