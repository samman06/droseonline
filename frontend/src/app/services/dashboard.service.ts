import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/dashboard/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
