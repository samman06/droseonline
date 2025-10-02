import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  fullName: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  academicInfo?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  phoneNumber?: string;
  dateOfBirth?: Date;
  academicInfo?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user and token from localStorage on service initialization
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'teacher';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  logout(): void {
    // Call backend logout endpoint
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe();
    
    // Clear local data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/refresh-token`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            this.tokenSubject.next(response.data.token);
            localStorage.setItem('token', response.data.token);
          }
        })
      );
  }

  verifyToken(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/auth/verify-token`);
  }

  validateToken(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/auth/verify-token`);
  }

  updateProfile(profileData: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/auth/profile`, profileData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        })
      );
  }

  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/auth/change-password`, passwordData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private setAuthData(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }
}
