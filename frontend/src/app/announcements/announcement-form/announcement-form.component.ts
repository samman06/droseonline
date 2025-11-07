import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AnnouncementService } from '../../services/announcement.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? ('announcements.edit' | translate) : ('announcements.create' | translate) }} {{ 'announcements.announcement' | translate }}</h1>
        <p class="text-gray-600 mt-1">{{ isEditMode ? ('announcements.updateDetails' | translate) : ('announcements.postNew' | translate) }}</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <form *ngIf="!loading" [formGroup]="announcementForm" (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-sm p-6">
        <!-- Title -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'announcements.announcementTitle' | translate }} <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            formControlName="title"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            [placeholder]="'announcements.enterTitle' | translate">
          <div *ngIf="announcementForm.get('title')?.invalid && announcementForm.get('title')?.touched" class="text-red-500 text-sm mt-1">
            {{ 'announcements.titleRequired' | translate }}
          </div>
        </div>

        <!-- Content -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'announcements.content' | translate }} <span class="text-red-500">*</span>
          </label>
          <textarea 
            formControlName="content"
            rows="10"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            [placeholder]="'announcements.enterContent' | translate"></textarea>
          <div *ngIf="announcementForm.get('content')?.invalid && announcementForm.get('content')?.touched" class="text-red-500 text-sm mt-1">
            {{ 'announcements.contentRequired' | translate }}
          </div>
        </div>

        <!-- Type -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'announcements.type' | translate }} <span class="text-red-500">*</span>
          </label>
          <select formControlName="type" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="general">{{ 'announcements.types.general' | translate }}</option>
            <option value="academic">{{ 'announcements.types.academic' | translate }}</option>
            <option value="event">{{ 'announcements.types.event' | translate }}</option>
            <option value="emergency">{{ 'announcements.types.emergency' | translate }}</option>
            <option value="maintenance">{{ 'announcements.types.maintenance' | translate }}</option>
            <option value="policy">{{ 'announcements.types.policy' | translate }}</option>
            <option value="exam">{{ 'announcements.types.exam' | translate }}</option>
            <option value="assignment">{{ 'announcements.types.assignment' | translate }}</option>
          </select>
        </div>

        <!-- Priority -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'announcements.priority' | translate }}</label>
          <select formControlName="priority" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="low">{{ 'announcements.priorities.low' | translate }}</option>
            <option value="normal">{{ 'announcements.priorities.normal' | translate }}</option>
            <option value="high">{{ 'announcements.priorities.high' | translate }}</option>
            <option value="urgent">{{ 'announcements.priorities.urgent' | translate }}</option>
          </select>
        </div>

        <!-- Target Audience -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'announcements.targetAudience' | translate }}</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" formControlName="targetAudienceAll" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">{{ 'announcements.allUsers' | translate }}</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" formControlName="targetAudienceStudents" [disabled]="announcementForm.get('targetAudienceAll')?.value" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">{{ 'nav.students' | translate }}</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" formControlName="targetAudienceTeachers" [disabled]="announcementForm.get('targetAudienceAll')?.value" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">{{ 'nav.teachers' | translate }}</span>
            </label>
          </div>
        </div>

        <!-- Publish Options -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'announcements.publishDate' | translate }}</label>
            <input 
              type="datetime-local" 
              formControlName="publishAt"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'announcements.expireDate' | translate }}</label>
            <input 
              type="datetime-local" 
              formControlName="expiresAt"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
        </div>

        <!-- Options -->
        <div class="mb-6 space-y-2">
          <label class="flex items-center">
            <input type="checkbox" formControlName="isPinned" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <span class="ml-2 text-sm text-gray-700">{{ 'announcements.pinAnnouncement' | translate }}</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" formControlName="allowComments" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <span class="ml-2 text-sm text-gray-700">{{ 'announcements.allowComments' | translate }}</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" formControlName="sendEmail" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <span class="ml-2 text-sm text-gray-700">{{ 'announcements.sendEmailNotification' | translate }}</span>
          </label>
        </div>

        <!-- Tags -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'announcements.tags' | translate }}</label>
          <input 
            type="text" 
            formControlName="tags"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            [placeholder]="'announcements.tagsPlaceholder' | translate">
          <p class="text-xs text-gray-500 mt-1">{{ 'announcements.tagsHelp' | translate }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            (click)="cancel()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            {{ 'common.cancel' | translate }}
          </button>
          <button 
            *ngIf="!isEditMode"
            type="button" 
            (click)="saveDraft()"
            [disabled]="saving"
            class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50">
            {{ 'announcements.saveAsDraft' | translate }}
          </button>
          <button 
            type="submit" 
            [disabled]="saving || announcementForm.invalid"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ (saving && 'announcements.saving' || (isEditMode && 'common.update' || 'announcements.publish')) | translate }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class AnnouncementFormComponent implements OnInit {
  announcementForm!: FormGroup;
  isEditMode = false;
  announcementId: string | null = null;
  loading = false;
  saving = false;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    
    this.announcementId = this.route.snapshot.paramMap.get('id');
    if (this.announcementId) {
      this.isEditMode = true;
      this.loadAnnouncement();
    }

    // Set default publish date to now
    if (!this.isEditMode) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      this.announcementForm.patchValue({
        publishAt: now.toISOString().slice(0, 16)
      });
    }
  }

  initForm(): void {
    // Set publishAt to current datetime by default (for immediate publishing)
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"
    
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      type: ['general', Validators.required],
      priority: ['normal'],
      targetAudienceAll: [true],
      targetAudienceStudents: [false],
      targetAudienceTeachers: [false],
      publishAt: [currentDateTime], // Default to now
      expiresAt: [''],
      isPinned: [false],
      allowComments: [true],
      sendEmail: [false],
      tags: ['']
    });
  }

  loadAnnouncement(): void {
    if (!this.announcementId) return;
    
    this.loading = true;
    this.announcementService.getAnnouncement(this.announcementId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const announcement = response.data;
          
          // Format dates for datetime-local input
          const publishAt = announcement.publishAt 
            ? new Date(announcement.publishAt).toISOString().slice(0, 16) 
            : '';
          const expiresAt = announcement.expiresAt 
            ? new Date(announcement.expiresAt).toISOString().slice(0, 16) 
            : '';

          this.announcementForm.patchValue({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            priority: announcement.priority,
            targetAudienceAll: announcement.targetAudience?.includes('all'),
            targetAudienceStudents: announcement.targetAudience?.includes('students'),
            targetAudienceTeachers: announcement.targetAudience?.includes('teachers'),
            publishAt,
            expiresAt,
            isPinned: announcement.isPinned,
            allowComments: announcement.allowComments,
            tags: announcement.tags?.join(', ') || ''
          });
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/announcements']);
      }
    });
  }

  onSubmit(): void {
    if (this.announcementForm.invalid || this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'published';

    this.saving = true;
    const request = this.isEditMode && this.announcementId
      ? this.announcementService.updateAnnouncement(this.announcementId, formData)
      : this.announcementService.createAnnouncement(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.translate.instant(
              `announcements.${this.isEditMode ? 'updateSuccess' : 'publishSuccess'}`
            )
          );
          this.router.navigate(['/dashboard/announcements']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  saveDraft(): void {
    if (this.saving) return;

    const formData = this.prepareFormData();
    formData.status = 'draft';

    this.saving = true;
    this.announcementService.createAnnouncement(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('announcements.draftSaved'));
          this.router.navigate(['/dashboard/announcements']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  prepareFormData(): any {
    const formValue = this.announcementForm.value;
    
    // Determine audience (backend expects single string, not array)
    let audience = 'all'; // default
    if (formValue.targetAudienceAll) {
      audience = 'all';
    } else if (formValue.targetAudienceStudents && formValue.targetAudienceTeachers) {
      audience = 'all'; // Both selected = all
    } else if (formValue.targetAudienceStudents) {
      audience = 'students';
    } else if (formValue.targetAudienceTeachers) {
      audience = 'teachers';
    }

    // Parse tags
    const tags = formValue.tags 
      ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      : [];

    return {
      title: formValue.title,
      content: formValue.content,
      type: formValue.type,
      priority: formValue.priority,
      audience, // Changed from targetAudience array to audience string
      publishAt: formValue.publishAt || new Date().toISOString(),
      expiresAt: formValue.expiresAt || undefined,
      isPinned: formValue.isPinned,
      allowComments: formValue.allowComments,
      sendEmail: formValue.sendEmail,
      tags,
      status: 'published' // Add status field
    };
  }

  cancel(): void {
    this.router.navigate(['/dashboard/announcements']);
  }
}

