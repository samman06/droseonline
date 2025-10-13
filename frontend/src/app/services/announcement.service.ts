import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';

export interface Announcement {
  _id?: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'event' | 'emergency' | 'maintenance' | 'holiday';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  audience: 'all' | 'students' | 'teachers' | 'admins' | 'specific_groups' | 'specific_courses' | 'specific_users';
  targetGroups?: string[];
  targetCourses?: string[];
  targetUsers?: string[];
  author: string | any;
  status: 'draft' | 'published' | 'archived';
  publishAt?: Date;
  expiresAt?: Date;
  isPinned?: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  comments?: {
    user: string | any;
    content: string;
    createdAt: Date;
  }[];
  views?: {
    user: string;
    viewedAt: Date;
  }[];
  settings?: {
    allowComments?: boolean;
    requireAcknowledgment?: boolean;
    sendEmail?: boolean;
    sendNotification?: boolean;
  };
  stats?: {
    totalViews?: number;
    totalComments?: number;
    totalAcknowledgments?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnnouncementComment {
  _id?: string;
  announcement: string;
  user: string | any;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private readonly ANNOUNCEMENTS_ENDPOINT = 'announcements';

  constructor(private api: ApiService) {}

  // Announcement CRUD Operations
  getAnnouncements(params: QueryParams = {}): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, params);
  }

  getAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}`);
  }

  createAnnouncement(payload: Partial<Announcement>): Observable<ApiResponse<Announcement>> {
    return this.api.post(this.ANNOUNCEMENTS_ENDPOINT, payload);
  }

  updateAnnouncement(id: string, payload: Partial<Announcement>): Observable<ApiResponse<Announcement>> {
    return this.api.put(this.ANNOUNCEMENTS_ENDPOINT, id, payload);
  }

  deleteAnnouncement(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(this.ANNOUNCEMENTS_ENDPOINT, id);
  }

  // Status Management
  publishAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}/publish`, {});
  }

  archiveAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}/archive`, {});
  }

  unarchiveAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}/unarchive`, {});
  }

  // Pin Management
  pinAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}/pin`, {});
  }

  unpinAnnouncement(id: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${id}/unpin`, {});
  }

  // Comments
  getComments(announcementId: string, params: QueryParams = {}): Observable<ApiResponse<AnnouncementComment[]>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/comments`, params);
  }

  addComment(announcementId: string, content: string): Observable<ApiResponse<AnnouncementComment>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/comments`, { content });
  }

  updateComment(announcementId: string, commentId: string, content: string): Observable<ApiResponse<AnnouncementComment>> {
    return this.api.put(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/comments`, commentId, { content });
  }

  deleteComment(announcementId: string, commentId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/comments`, commentId);
  }

  // Views and Acknowledgments
  markAsViewed(announcementId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/view`, {});
  }

  acknowledgeAnnouncement(announcementId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/acknowledge`, {});
  }

  getViewers(announcementId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/viewers`, params);
  }

  getAcknowledgments(announcementId: string, params: QueryParams = {}): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/acknowledgments`, params);
  }

  // Filtering
  getPinnedAnnouncements(): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, { isPinned: true, status: 'published' });
  }

  getRecentAnnouncements(limit: number = 5): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, { 
      status: 'published', 
      limit, 
      sort: '-createdAt' 
    });
  }

  getAnnouncementsByType(type: string, params: QueryParams = {}): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, { ...params, type });
  }

  getAnnouncementsByPriority(priority: string, params: QueryParams = {}): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, { ...params, priority });
  }

  getMyAnnouncements(params: QueryParams = {}): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/my-announcements`, params);
  }

  // Bulk Operations
  bulkPublish(announcementIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/bulk-publish`, { announcementIds });
  }

  bulkArchive(announcementIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/bulk-archive`, { announcementIds });
  }

  bulkDelete(announcementIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/bulk-delete`, { announcementIds });
  }

  // Statistics
  getAnnouncementStats(announcementId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/stats`);
  }

  // File Attachments
  uploadAttachment(announcementId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/attachments`, formData);
  }

  deleteAttachment(announcementId: string, attachmentId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/attachments`, attachmentId);
  }

  // Search
  searchAnnouncements(searchTerm: string, params: QueryParams = {}): Observable<ApiResponse<Announcement[]>> {
    return this.api.get(this.ANNOUNCEMENTS_ENDPOINT, { ...params, search: searchTerm });
  }
}

