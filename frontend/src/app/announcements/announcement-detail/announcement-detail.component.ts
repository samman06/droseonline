import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnouncementService, Announcement } from '../../services/announcement.service';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AvatarComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="bg-white rounded-xl shadow-lg p-12">
          <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>

        <!-- Announcement Detail -->
        <div *ngIf="!loading && announcement" class="space-y-6">
          
          <!-- Header -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-start justify-between mb-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-4">
                  <!-- Priority Badge -->
                  <span 
                    [class]="getPriorityClass(announcement.priority)"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium uppercase">
                    {{ announcement.priority }}
                  </span>
                  
                  <!-- Type Badge -->
                  <span 
                    [class]="getTypeClass(announcement.type)"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase">
                    {{ announcement.type }}
                  </span>

                  <!-- Pinned Badge -->
                  <span *ngIf="announcement.isPinned" 
                        class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    Pinned
                  </span>
                </div>

                <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ announcement.title }}</h1>
                
                <!-- Author Info -->
                <div class="flex items-center gap-3 mb-4">
                  <app-avatar 
                    [user]="announcement.author"
                    size="md">
                  </app-avatar>
                  <div>
                    <p class="text-gray-900 font-medium">
                      {{ announcement.author?.firstName }} {{ announcement.author?.lastName }}
                    </p>
                    <p class="text-gray-500 text-sm">{{ announcement.author?.role | titlecase }}</p>
                  </div>
                </div>

                <!-- Meta Info -->
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {{ formatDate(announcement.publishAt) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    {{ announcement.stats?.views || 0 }} views
                  </span>
                  <span *ngIf="announcement.expiresAt" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Expires {{ formatDate(announcement.expiresAt) }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 ml-4">
                <button 
                  (click)="router.navigate(['/dashboard/announcements'])"
                  class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to List">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                </button>
                <button 
                  *ngIf="canEdit"
                  [routerLink]="['/dashboard/announcements', announcement._id, 'edit']"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button 
                  *ngIf="canDelete"
                  (click)="deleteAnnouncement()"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="prose max-w-none mb-6">
              <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ announcement.content }}</div>
            </div>

            <!-- Event Details (if type is event) -->
            <div *ngIf="announcement.type === 'event' && announcement.eventDetails" 
                 class="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Event Details
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div *ngIf="announcement.eventDetails.eventDate">
                  <span class="text-gray-600">Date:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ formatDate(announcement.eventDetails.eventDate) }}</span>
                </div>
                <div *ngIf="announcement.eventDetails.location">
                  <span class="text-gray-600">Location:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ announcement.eventDetails.location }}</span>
                </div>
                <div *ngIf="announcement.eventDetails.startTime">
                  <span class="text-gray-600">Time:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ announcement.eventDetails.startTime }} - {{ announcement.eventDetails.endTime }}</span>
                </div>
                <div *ngIf="announcement.eventDetails.maxParticipants">
                  <span class="text-gray-600">Max Participants:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ announcement.eventDetails.maxParticipants }}</span>
                </div>
              </div>
            </div>

            <!-- Like and Comment Stats -->
            <div class="flex items-center gap-6 pt-6 border-t border-gray-200">
              <button 
                (click)="toggleLike()"
                [class.text-red-600]="isLiked"
                [class.text-gray-600]="!isLiked"
                class="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <svg class="w-5 h-5" [class.fill-current]="isLiked" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                <span class="font-medium">{{ announcement.stats?.likes || 0 }}</span>
                <span class="text-sm">{{ isLiked ? 'Liked' : 'Like' }}</span>
              </button>
              <div class="flex items-center gap-2 text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span class="font-medium">{{ announcement.stats?.comments || 0 }}</span>
                <span class="text-sm">Comments</span>
              </div>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Comments</h3>

            <!-- Comments Disabled Notice -->
            <div *ngIf="announcement.allowComments === false" class="bg-gray-50 rounded-lg p-6 text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
              <p class="text-gray-600 font-medium">Comments are disabled for this announcement</p>
            </div>

            <!-- Add Comment Form (only if comments allowed) -->
            <div *ngIf="announcement.allowComments !== false" class="mb-8">
              <div class="flex gap-3">
                <app-avatar 
                  [user]="currentUser"
                  size="sm">
                </app-avatar>
                <div class="flex-1">
                  <textarea 
                    [(ngModel)]="newComment"
                    placeholder="Write a comment..."
                    rows="3"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  ></textarea>
                  <div class="flex justify-end mt-2">
                    <button 
                      (click)="addComment()"
                      [disabled]="!newComment.trim() || isSubmittingComment"
                      class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                      {{ isSubmittingComment ? 'Posting...' : 'Post Comment' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comments List (show if comments not explicitly disabled) -->
            <div *ngIf="announcement.allowComments !== false" class="space-y-6">
              <div *ngIf="!announcement.comments || announcement.comments.length === 0" 
                   class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p class="text-lg font-medium">No comments yet</p>
                <p class="text-sm mt-1">Be the first to comment!</p>
              </div>

              <div *ngFor="let comment of announcement.comments" 
                   class="flex gap-3 pb-6 border-b border-gray-200 last:border-0">
                <app-avatar 
                  [user]="comment.user"
                  size="sm">
                </app-avatar>
                <div class="flex-1">
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-semibold text-gray-900">
                        {{ comment.user?.firstName }} {{ comment.user?.lastName }}
                      </h4>
                      <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="text-gray-700">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Error State -->
        <div *ngIf="!loading && error" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg class="w-20 h-20 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h3>
          <button 
            (click)="router.navigate(['/dashboard/announcements'])"
            class="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Back to Announcements
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnnouncementDetailComponent implements OnInit {
  announcement: Announcement | null = null;
  currentUser: User | null = null;
  loading = true;
  error: string = '';
  newComment: string = '';
  isSubmittingComment = false;
  isLiked = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private announcementService: AnnouncementService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAnnouncement(id);
    } else {
      this.error = 'Invalid announcement ID';
      this.loading = false;
    }
  }

  loadAnnouncement(id: string): void {
    this.loading = true;
    this.error = '';
    
    this.announcementService.getAnnouncement(id).subscribe({
      next: (response) => {
        console.log('Announcement API Response:', response);
        
        if (response.success && response.data) {
          // Handle nested structure from backend
          this.announcement = (response.data as any).announcement || response.data;
          
          console.log('Loaded announcement:', this.announcement);
          
          if (this.announcement) {
            console.log('Announcement likes:', this.announcement.likes);
            console.log('Announcement comments:', this.announcement.comments);
            console.log('Allow comments:', this.announcement.allowComments);
            
            // Ensure stats exist
            if (!this.announcement.stats) {
              this.announcement.stats = {
                views: 0,
                likes: 0,
                comments: 0
              };
            }
            
            // Ensure comments array exists
            if (!this.announcement.comments) {
              this.announcement.comments = [];
            }
            
            // Ensure likes array exists
            if (!this.announcement.likes) {
              this.announcement.likes = [];
            }
            
            this.checkIfLiked();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcement:', error);
        this.error = error.error?.message || 'Failed to load announcement';
        this.loading = false;
        this.toastService.error(this.error);
      }
    });
  }

  checkIfLiked(): void {
    this.isLiked = false;
    if (!this.announcement || !this.currentUser) {
      console.log('Cannot check if liked: announcement or currentUser missing');
      return;
    }
    
    console.log('Checking if liked by user:', this.currentUser._id);
    
    if (this.announcement.likes && Array.isArray(this.announcement.likes)) {
      this.isLiked = (this.announcement.likes as any[]).some((like: any) => {
        const likeUserId = like.user?._id || like.user;
        console.log('Comparing like user:', likeUserId, 'with current user:', this.currentUser?._id);
        return likeUserId === this.currentUser?._id;
      });
      
      console.log('Is liked:', this.isLiked);
    } else {
      console.log('No likes array or not an array');
    }
  }

  toggleLike(): void {
    if (!this.announcement?._id) return;

    this.announcementService.toggleLike(this.announcement._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isLiked = response.data.isLiked;
          if (this.announcement && this.announcement.stats) {
            this.announcement.stats.likes = response.data.likes;
          }
          this.toastService.success(this.isLiked ? 'Announcement liked!' : 'Like removed');
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        this.toastService.error('Failed to update like');
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.announcement?._id) return;

    this.isSubmittingComment = true;
    this.announcementService.addComment(this.announcement._id, this.newComment.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.announcement = (response.data as any).announcement || response.data;
          this.newComment = '';
          this.toastService.success('Comment added successfully');
        }
        this.isSubmittingComment = false;
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.toastService.error('Failed to add comment');
        this.isSubmittingComment = false;
      }
    });
  }

  deleteAnnouncement(): void {
    if (!this.announcement?._id) return;

    this.confirmationService.confirm({
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed && this.announcement?._id) {
        this.announcementService.deleteAnnouncement(this.announcement._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('Announcement deleted successfully');
              this.router.navigate(['/dashboard/announcements']);
            }
          },
          error: (error) => {
            console.error('Error deleting announcement:', error);
            this.toastService.error('Failed to delete announcement');
          }
        });
      }
    });
  }

  get canEdit(): boolean {
    if (!this.announcement || !this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return this.announcement.author?._id === this.currentUser._id || this.announcement.author === this.currentUser._id;
  }

  get canDelete(): boolean {
    if (!this.announcement || !this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return this.announcement.author?._id === this.currentUser._id || this.announcement.author === this.currentUser._id;
  }

  getPriorityClass(priority: string): string {
    const classes: any = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return classes[priority] || classes.normal;
  }

  getTypeClass(type: string): string {
    const classes: any = {
      emergency: 'bg-red-100 text-red-800',
      academic: 'bg-purple-100 text-purple-800',
      event: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      policy: 'bg-indigo-100 text-indigo-800',
      exam: 'bg-pink-100 text-pink-800',
      assignment: 'bg-teal-100 text-teal-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return classes[type] || classes.general;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

