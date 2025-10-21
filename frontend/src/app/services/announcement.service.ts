import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, QueryParams } from './api.service';

export interface Announcement {
  _id?: string;
  title: string;
  content: string;
  summary?: string;
  type: 'general' | 'academic' | 'event' | 'emergency' | 'maintenance' | 'policy' | 'exam' | 'assignment';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  audience: 'all' | 'students' | 'teachers' | 'admins' | 'specific_groups' | 'specific_courses' | 'specific_users';
  targetGroups?: any[];
  targetCourses?: any[];
  targetUsers?: string[];
  author: string | any;
  status: 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
  publishAt?: Date;
  expiresAt?: Date;
  isUrgent?: boolean;
  isPinned?: boolean;
  allowComments?: boolean;
  attachments?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadDate: Date;
  }[];
  images?: {
    filename: string;
    path: string;
    caption?: string;
    altText?: string;
  }[];
  eventDetails?: {
    eventDate?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    maxParticipants?: number;
    registrationRequired?: boolean;
    registrationDeadline?: Date;
    contactPerson?: string;
    additionalInfo?: string;
  };
  notificationSettings?: {
    sendEmail?: boolean;
    sendPush?: boolean;
    sendSMS?: boolean;
    notifyImmediately?: boolean;
  };
  readBy?: {
    user: string | any;
    readAt: Date;
    ipAddress?: string;
  }[];
  likes?: {
    user: string | any;
    likedAt: Date;
  }[];
  comments?: {
    _id?: string;
    user: string | any;
    content: string;
    createdAt: Date;
    isEdited?: boolean;
    editedAt?: Date;
    replies?: {
      user: string | any;
      content: string;
      createdAt: Date;
    }[];
  }[];
  tags?: string[];
  stats?: {
    views?: number;
    uniqueViews?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clickThroughRate?: number;
  };
  approval?: {
    required?: boolean;
    approvedBy?: string | any;
    approvedAt?: Date;
    rejectionReason?: string;
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

  addComment(announcementId: string, content: string): Observable<ApiResponse<Announcement>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/comment`, { content });
  }

  // Like/Unlike
  toggleLike(announcementId: string): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ANNOUNCEMENTS_ENDPOINT}/${announcementId}/like`, {});
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

