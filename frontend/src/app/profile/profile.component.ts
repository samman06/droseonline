import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';
import { AvatarService } from '../services/avatar.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        
        <!-- Header -->
        <div class="mb-8">
          <button 
            (click)="goBack()"
            class="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-medium transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </button>
          
          <div class="flex items-center justify-between">
            <div>
              <h1 *ngIf="isOwnProfile" class="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <h1 *ngIf="!isOwnProfile" class="text-4xl font-bold text-gray-900 mb-2">User Profile</h1>
              <p class="text-gray-600">{{ isEditMode ? 'Edit your information' : 'View and manage your account' }}</p>
            </div>
            
            <div class="flex gap-3">
              <button 
                *ngIf="!isEditMode && canEdit"
                (click)="enableEditMode()"
                class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-20">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p class="text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ error }}</p>
          </div>
        </div>

        <!-- Profile Content -->
        <div *ngIf="!loading && !error && profileUser" class="space-y-6">
          
          <!-- Profile Card -->
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <!-- Header with gradient -->
            <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-12 relative">
              <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
              <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
              
              <div class="relative z-10 flex items-center gap-6">
                <!-- Avatar with Upload -->
                <div class="relative">
                  <div class="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 overflow-hidden flex items-center justify-center text-white text-5xl font-bold">
                    <!-- Avatar Image -->
                    <img 
                      *ngIf="hasAvatar()" 
                      [src]="getCurrentAvatar()" 
                      alt="{{ profileUser.firstName }} {{ profileUser.lastName }}"
                      class="w-full h-full object-cover" />
                    <!-- Initials Fallback -->
                    <span *ngIf="!hasAvatar()">
                      {{ getInitials(profileUser.firstName, profileUser.lastName) }}
                    </span>
                  </div>
                  
                  <!-- Upload Button (Edit Mode Only) -->
                  <button
                    *ngIf="isEditMode && canEdit"
                    type="button"
                    (click)="fileInput.click()"
                    [disabled]="uploadingAvatar"
                    class="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    title="Upload photo">
                    <svg *ngIf="!uploadingAvatar" class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <svg *ngIf="uploadingAvatar" class="animate-spin w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </button>
                  
                  <!-- Remove Button (Edit Mode + Avatar Exists) -->
                  <button
                    *ngIf="isEditMode && canEdit && hasAvatar()"
                    type="button"
                    (click)="clearAvatar()"
                    class="absolute top-0 right-0 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    title="Remove photo">
                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <!-- Hidden File Input -->
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  (change)="onAvatarSelected($event)"
                  class="hidden" />
                
                <!-- Basic Info -->
                <div class="flex-1">
                  <h2 class="text-3xl font-bold text-white mb-2">
                    {{ profileUser.firstName }} {{ profileUser.lastName }}
                  </h2>
                  <div class="flex items-center gap-4 text-white/90">
                    <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
                      {{ profileUser.role }}
                    </span>
                    <span class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      {{ profileUser.email }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Form -->
            <div class="p-8">
              <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
                
                <!-- Personal Information Section -->
                <div class="mb-8">
                  <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Personal Information
                  </h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- First Name -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input 
                        type="text"
                        formControlName="firstName"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter first name">
                      <p *ngIf="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched" 
                         class="mt-1 text-sm text-red-600">First name is required</p>
                    </div>
                    
                    <!-- Last Name -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input 
                        type="text"
                        formControlName="lastName"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter last name">
                      <p *ngIf="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched" 
                         class="mt-1 text-sm text-red-600">Last name is required</p>
                    </div>
                    
                    <!-- Email -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email"
                        formControlName="email"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter email">
                      <p *ngIf="profileForm.get('email')?.invalid && profileForm.get('email')?.touched" 
                         class="mt-1 text-sm text-red-600">Valid email is required</p>
                    </div>
                    
                    <!-- Phone -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel"
                        formControlName="phone"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number">
                    </div>
                  </div>
                </div>

                <!-- Role-Specific Information -->
                <div *ngIf="profileUser.role === 'student'" class="mb-8">
                  <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    Academic Information
                  </h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Student Code</label>
                      <input 
                        type="text"
                        [value]="getUserCode()"
                        readonly
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Current Grade</label>
                      <input 
                        *ngIf="!isEditMode"
                        type="text"
                        [value]="profileUser.academicInfo?.currentGrade || 'Not Set'"
                        readonly
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed">
                      <select 
                        *ngIf="isEditMode"
                        formControlName="currentGrade"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white">
                        <option value="">Select Grade</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Enrolled Groups</label>
                      <input 
                        type="text"
                        [value]="(profileUser.academicInfo?.groups?.length || 0) + ' groups'"
                        readonly
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed">
                    </div>
                  </div>
                </div>

                <div *ngIf="profileUser.role === 'teacher'" class="mb-8">
                  <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    Professional Information
                  </h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Teacher Code</label>
                      <input 
                        type="text"
                        [value]="getUserCode()"
                        readonly
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input 
                        type="text"
                        formControlName="department"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter department">
                    </div>
                    
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <input 
                        type="text"
                        formControlName="specialization"
                        [readonly]="!isEditMode"
                        [class.bg-gray-50]="!isEditMode"
                        [class.cursor-not-allowed]="!isEditMode"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter specialization">
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div *ngIf="isEditMode" class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button 
                    type="button"
                    (click)="cancelEdit()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    [disabled]="!profileForm.valid || saving"
                    class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg *ngIf="!saving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <div *ngIf="saving" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {{ saving ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Additional Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Account Status -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-900">Account Status</h3>
                <span [class]="profileUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                      class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ profileUser.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-sm text-gray-600">
                Member since {{ getMemberSinceDate() }}
              </p>
            </div>

            <!-- Last Login -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center gap-3 mb-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-lg font-bold text-gray-900">Last Login</h3>
              </div>
              <p class="text-sm text-gray-600">
                {{ profileUser.lastLogin ? formatDate(profileUser.lastLogin) : 'Never' }}
              </p>
            </div>

            <!-- Profile Completion -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center gap-3 mb-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-lg font-bold text-gray-900">Profile Complete</h3>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-indigo-600 h-2 rounded-full transition-all" [style.width.%]="getProfileCompletion()"></div>
              </div>
              <p class="text-sm text-gray-600 mt-2">{{ getProfileCompletion() }}%</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profileUser: User | null = null;
  currentUser: User | null = null;
  loading = false;
  saving = false;
  error = '';
  isEditMode = false;
  userId: string | null = null;
  avatarPreview: string | null = null;
  uploadingAvatar = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public permissionService: PermissionService,
    private toastService: ToastService,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private avatarService: AvatarService
  ) {}

  ngOnInit() {
    this.initializeForm();
    
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get user ID from route (if viewing another user's profile)
    this.route.params.subscribe(params => {
      this.userId = params['id'] || null;
      this.loadProfile();
    });
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      department: [''],
      specialization: [''],
      currentGrade: [''], // Current grade for students
      avatar: [''] // Avatar field for image upload
    });
  }

  loadProfile() {
    this.loading = true;
    this.error = '';

    // Always fetch fresh data from API
    if (!this.userId) {
      // Fetch current user's profile from API
      this.api.getWithoutId('auth/profile').subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.profileUser = response.data.user || response.data;
            this.populateForm();
            
            // Update AuthService with fresh data
            if (this.profileUser) {
              this.authService.updateCurrentUser(this.profileUser);
            }
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading profile:', error);
          this.error = error.error?.message || 'Failed to load profile';
          this.loading = false;
          this.toastService.error(this.error);
        }
      });
      return;
    }

    // Load specific user's profile (for admins viewing other profiles)
    this.api.get(`/users/${this.userId}`).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.profileUser = response.data.user || response.data;
          this.populateForm();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = error.error?.message || 'Failed to load profile';
        this.loading = false;
        this.toastService.error(this.error);
      }
    });
  }

  populateForm() {
    if (this.profileUser) {
      const avatar = (this.profileUser as any).avatar || '';
      
      this.profileForm.patchValue({
        firstName: this.profileUser.firstName || '',
        lastName: this.profileUser.lastName || '',
        email: this.profileUser.email || '',
        phone: (this.profileUser as any).phoneNumber || (this.profileUser as any).phone || '',
        // department and specialization are in academicInfo
        department: (this.profileUser as any).academicInfo?.department || '',
        specialization: (this.profileUser as any).academicInfo?.specialization || '',
        currentGrade: (this.profileUser as any).academicInfo?.currentGrade || '',
        avatar: avatar
      });
      
      // Set avatar preview if avatar exists
      if (avatar) {
        this.avatarPreview = avatar;
      }
    }
  }

  enableEditMode() {
    this.isEditMode = true;
  }

  cancelEdit() {
    this.isEditMode = false;
    this.populateForm(); // Reset form to original values
  }

  onSubmit() {
    if (!this.profileForm.valid) {
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.saving = true;
    const formData = this.profileForm.value;
    
    // Filter out empty/null values and only send actual changes
    const cleanData: any = {};
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      // Only include non-empty values
      if (value !== null && value !== '' && value !== undefined) {
        // For arrays, only include if not empty
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleanData[key] = value;
          }
        } else {
          cleanData[key] = value;
        }
      }
    });

    console.log('Sending profile update:', cleanData);
    
    // For updating own profile (no userId), use the putWithoutId method
    // For admin updating another user (with userId), use the regular put method
    const observable = this.userId 
      ? this.api.put('users', this.userId, cleanData)
      : this.api.putWithoutId('auth/profile', cleanData);

    observable.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Profile updated successfully');
          this.isEditMode = false;
          
          // Update the profileUser with the response data
          if (response.data && response.data.user) {
            this.profileUser = response.data.user;
            
            // If updating own profile, update currentUser too
            if (!this.userId || this.userId === this.currentUser?._id) {
              // Update the current user in AuthService
              this.authService.updateCurrentUser(response.data.user);
            }
            
            // Repopulate form with updated data
            this.populateForm();
          } else {
            // Fallback: reload profile from server
            this.loadProfile();
          }
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toastService.error(error.error?.message || 'Failed to update profile');
        this.saving = false;
      }
    });
  }

  // PERMISSION GETTERS
  get canEdit(): boolean {
    // Users can edit their own profile
    // Admins can edit any profile
    return this.isOwnProfile || this.permissionService.isAdmin();
  }

  get isOwnProfile(): boolean {
    return !this.userId || this.userId === this.currentUser?._id;
  }

  // UTILITY METHODS
  getUserCode(): string {
    if (!this.profileUser) return 'N/A';
    
    const academicInfo = (this.profileUser as any)?.academicInfo;
    if (!academicInfo) return 'N/A';
    
    // Students have studentId, Teachers and Admins have employeeId
    if (this.profileUser.role === 'student') {
      return academicInfo.studentId || 'N/A';
    } else if (this.profileUser.role === 'teacher' || this.profileUser.role === 'admin') {
      return academicInfo.employeeId || 'N/A';
    }
    
    return 'N/A';
  }

  getMemberSinceDate(): string {
    const createdAt = (this.profileUser as any)?.createdAt;
    return this.formatDate(createdAt);
  }

  getInitials(firstName: string = '', lastName: string = ''): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getProfileCompletion(): number {
    if (!this.profileUser) return 0;
    
    let completed = 0;
    const fields = ['firstName', 'lastName', 'email', 'phone'];
    
    fields.forEach(field => {
      if ((this.profileUser as any)[field]) completed++;
    });
    
    // Add role-specific fields
    if (this.profileUser.role === 'teacher') {
      if ((this.profileUser as any).academicInfo?.department) completed++;
      if ((this.profileUser as any).academicInfo?.specialization) completed++;
      return Math.round((completed / 6) * 100);
    }
    
    return Math.round((completed / 4) * 100);
  }

  goBack() {
    this.router.navigate(['/dashboard/home']);
  }

  // Avatar upload methods
  async onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingAvatar = true;
    this.error = '';

    try {
      // Validate and convert image
      const base64Image = await this.avatarService.validateAndResizeImage(file);
      
      if (base64Image) {
        // Set preview
        this.avatarPreview = base64Image;
        
        // Update form
        this.profileForm.patchValue({ avatar: base64Image });
        
        console.log('Avatar uploaded successfully');
        this.toastService.success('Photo uploaded successfully');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      this.error = error.message || 'Failed to upload avatar. Please try a different image.';
      this.toastService.error(this.error);
      this.clearAvatar();
    } finally {
      this.uploadingAvatar = false;
    }
  }

  clearAvatar() {
    this.avatarPreview = null;
    this.profileForm.patchValue({ avatar: '' });
  }

  getAvatarUrl(): string {
    if (this.avatarPreview) {
      return this.avatarPreview;
    }
    if (this.profileUser) {
      return this.avatarService.getAvatarUrl(this.profileUser, 128);
    }
    return '';
  }

  hasAvatar(): boolean {
    return !!(this.avatarPreview || (this.profileUser as any)?.avatar);
  }

  getCurrentAvatar(): string {
    return this.avatarPreview || (this.profileUser as any)?.avatar || '';
  }
}

