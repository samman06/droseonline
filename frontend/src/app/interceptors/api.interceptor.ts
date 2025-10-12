import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  
  constructor(
    private configService: ConfigService,
    private injector: Injector
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (!request.url.startsWith(this.configService.apiBaseUrl)) {
      return next.handle(request);
    }

    // Get the auth token - ALWAYS check localStorage first (source of truth)
    // Then fallback to AuthService if localStorage is empty
    let token: string | null = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    // If not in localStorage, try AuthService
    if (!token) {
      const authService = this.injector.get(AuthService);
      token = authService.token;
    }

    console.log('🔍 API Interceptor:', {
      url: request.url,
      method: request.method,
      tokenFound: token ? 'YES' : 'NO',
      tokenSource: token ? (localStorage.getItem('token') ? 'localStorage' : 'AuthService') : 'NONE',
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });

    // Clone the request and add common headers
    const headers: any = {
      'Content-Type': 'application/json',
      'X-App-Version': this.configService.version,
      'X-Environment': this.configService.isProduction ? 'production' : 'development'
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
      this.configService.log('✅ Auth token added to request:', request.url);
    } else {
      console.error('❌ NO TOKEN FOUND! Request will fail with 401');
      console.error('   - localStorage.token:', localStorage.getItem('token') ? 'exists' : 'missing');
      console.error('   - URL:', request.url);
      this.configService.error('❌ No auth token available for request:', request.url);
    }

    const apiRequest = request.clone({
      setHeaders: headers
    });

    console.log('📤 Final request headers:', {
      authorization: apiRequest.headers.get('Authorization') ? 'Bearer ***' : 'MISSING',
      contentType: apiRequest.headers.get('Content-Type')
    });

    // Log request in debug mode
    this.configService.log('HTTP Request:', {
      method: apiRequest.method,
      url: apiRequest.url,
      headers: apiRequest.headers.keys(),
      body: apiRequest.body
    });

    return next.handle(apiRequest).pipe(
      // Apply timeout from environment
      timeout(this.configService.apiTimeout),
      
      // Retry failed requests once (except for POST/PUT/DELETE)
      retry({
        count: apiRequest.method === 'GET' ? 1 : 0,
        delay: (error, retryCount) => {
          this.configService.warn(`Retrying request (attempt ${retryCount + 1}):`, apiRequest.url);
          return throwError(() => error);
        }
      }),
      
      // Handle errors
      catchError((error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.configService.error('Request timeout:', apiRequest.url);
          return throwError(() => new Error(`Request timeout after ${this.configService.apiTimeout}ms`));
        }

        this.configService.error('HTTP Error:', {
          status: error instanceof HttpErrorResponse ? error.status : 'Unknown',
          message: error.message,
          url: apiRequest.url
        });

        return throwError(() => error);
      })
    );
  }
}
