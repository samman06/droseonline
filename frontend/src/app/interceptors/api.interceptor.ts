import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  
  constructor(private configService: ConfigService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (!request.url.startsWith(this.configService.apiBaseUrl)) {
      return next.handle(request);
    }

    // Clone the request and add common headers
    const apiRequest = request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-App-Version': this.configService.version,
        'X-Environment': this.configService.isProduction ? 'production' : 'development'
      }
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
