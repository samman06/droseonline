import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { AvatarService } from '../../services/avatar.service';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.scss']
})
export class StudentRegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  avatarPreview: string | null = null;
  uploadingAvatar = false;

  grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', // Primary
    'Grade 7', 'Grade 8', 'Grade 9', // Preparatory
    'Grade 10', 'Grade 11', 'Grade 12' // Secondary
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private avatarService: AvatarService,
    private translate: TranslateService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
      currentGrade: ['', [Validators.required]],
      avatar: [''] // Optional avatar field
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.currentUser) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Form getters for template
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get currentGrade() { return this.registerForm.get('currentGrade'); }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;
    
    // Prepare registration data
    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      avatar: formData.avatar || null, // Include avatar if uploaded
      role: 'student' as 'admin' | 'teacher' | 'student',
      academicInfo: {
        currentGrade: formData.currentGrade
      }
    };

    console.log('Registering student:', registrationData);

    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.successMessage = this.translate.instant('auth.registrationSuccess');
        this.isLoading = false;
        
        // Redirect to dashboard after successful registration
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage = error.message || this.translate.instant('auth.registrationFailed');
        this.isLoading = false;
      }
    });
  }

  // Avatar upload methods
  async onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingAvatar = true;
    this.errorMessage = '';

    try {
      // Validate and convert image
      const base64Image = await this.avatarService.validateAndResizeImage(file);
      
      if (base64Image) {
        // Set preview
        this.avatarPreview = base64Image;
        
        // Update form
        this.registerForm.patchValue({ avatar: base64Image });
        
        console.log('Avatar uploaded successfully');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      this.errorMessage = error.message || this.translate.instant('profile.failedToUploadAvatar');
      this.clearAvatar();
    } finally {
      this.uploadingAvatar = false;
    }
  }

  clearAvatar() {
    this.avatarPreview = null;
    this.registerForm.patchValue({ avatar: '' });
  }

  getPreviewInitials(): string {
    const firstName = this.registerForm.get('firstName')?.value || '';
    const lastName = this.registerForm.get('lastName')?.value || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }
}

