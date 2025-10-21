import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Material {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: 'file' | 'link' | 'video' | 'document' | 'presentation' | 'image' | 'other';
  category: 'lecture_notes' | 'reading' | 'video' | 'practice' | 'syllabus' | 'exam_material' | 'supplementary' | 'other';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  externalUrl?: string;
  course: any;
  groups?: any[];
  uploadedBy: any;
  visibility: 'all_students' | 'specific_groups' | 'teachers_only';
  isActive: boolean;
  isPublished: boolean;
  tags?: string[];
  folder?: string;
  stats: {
    downloadCount: number;
    viewCount: number;
    lastAccessedAt?: Date;
  };
  uploadDate: Date;
  lastModified: Date;
  uploadedAgo?: string;
  icon?: string;
  relatedAssignment?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialQueryParams {
  page?: number;
  limit?: number;
  course?: string;
  group?: string;
  type?: string;
  category?: string;
  folder?: string;
  search?: string;
  sort?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private apiUrl = `${environment.apiBaseUrl}/materials`;

  constructor(private http: HttpClient) {}

  // Get all materials with filters
  getMaterials(params: MaterialQueryParams = {}): Observable<ApiResponse<{ materials: Material[], pagination: any }>> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<{ materials: Material[], pagination: any }>>(
      this.apiUrl,
      { params: httpParams }
    );
  }

  // Get single material
  getMaterial(id: string): Observable<ApiResponse<Material>> {
    return this.http.get<ApiResponse<Material>>(`${this.apiUrl}/${id}`);
  }

  // Create material
  createMaterial(material: Partial<Material>): Observable<ApiResponse<Material>> {
    return this.http.post<ApiResponse<Material>>(this.apiUrl, material);
  }

  // Update material
  updateMaterial(id: string, material: Partial<Material>): Observable<ApiResponse<Material>> {
    return this.http.put<ApiResponse<Material>>(`${this.apiUrl}/${id}`, material);
  }

  // Delete material
  deleteMaterial(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  // Track download
  trackDownload(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/download`, {});
  }

  // Get materials for a course
  getMaterialsByCourse(courseId: string, filters: any = {}): Observable<ApiResponse<Material[]>> {
    let httpParams = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<Material[]>>(
      `${this.apiUrl}/course/${courseId}`,
      { params: httpParams }
    );
  }

  // Get materials statistics
  getMaterialsStats(courseId?: string): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();
    if (courseId) {
      httpParams = httpParams.set('course', courseId);
    }
    
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/stats/overview`,
      { params: httpParams }
    );
  }

  // Helper: Get icon for material type
  getIconForType(type: string): string {
    const iconMap: { [key: string]: string } = {
      'file': 'document',
      'document': 'document-text',
      'link': 'link',
      'video': 'play-circle',
      'presentation': 'presentation-chart-bar',
      'image': 'photograph',
      'other': 'folder'
    };
    return iconMap[type] || 'document';
  }

  // Helper: Get color for material type
  getColorForType(type: string): string {
    const colorMap: { [key: string]: string } = {
      'file': 'blue',
      'document': 'purple',
      'link': 'green',
      'video': 'red',
      'presentation': 'yellow',
      'image': 'pink',
      'other': 'gray'
    };
    return colorMap[type] || 'gray';
  }

  // Helper: Format file size
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  // Helper: Download material
  downloadMaterial(material: Material): void {
    if (material.fileUrl) {
      // Track download
      this.trackDownload(material._id).subscribe();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = material.fileName || material.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (material.externalUrl) {
      window.open(material.externalUrl, '_blank');
    }
  }

  // Helper: Check if material can be previewed
  canPreview(material: Material): boolean {
    if (!material.mimeType) return false;
    
    const previewableMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html'
    ];
    
    return previewableMimeTypes.includes(material.mimeType);
  }
}

