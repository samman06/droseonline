import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AssignmentService } from '../../services/assignment.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-quiz-taking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8 px-4">
      <div class="max-w-4xl mx-auto">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <p class="mt-4 text-gray-600 font-medium">{{ 'assignments.loadingQuiz' | translate }}</p>
        </div>

        <!-- Quiz Header with Timer -->
        <div *ngIf="!loading && quiz" class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl shadow-2xl p-6 mb-6">
          <div class="flex items-center justify-between text-white">
            <div>
              <h1 class="text-3xl font-bold mb-2">{{ quiz.title }}</h1>
              <p class="text-blue-100">{{ quiz.description }}</p>
              <div class="flex items-center gap-4 mt-3 text-sm">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                  </svg>
                  {{ quiz.questions.length }} {{ 'assignments.questions' | translate }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  {{ quiz.maxPoints }} {{ 'assignments.points' | translate }}
                </span>
              </div>
            </div>
            
            <!-- Timer (if time limit set) -->
            <div *ngIf="hasTimeLimit" class="text-center">
              <div class="text-5xl font-bold mb-1" [ngClass]="{
                'text-red-300 animate-pulse': timeRemaining < 60,
                'text-yellow-300': timeRemaining >= 60 && timeRemaining < 300,
                'text-white': timeRemaining >= 300
              }">
                {{ formatTime(timeRemaining) }}
              </div>
              <div class="text-sm text-blue-100">Time Remaining</div>
            </div>
          </div>
        </div>

        <!-- Quiz Instructions -->
        <div *ngIf="!loading && quiz && !started" class="bg-white rounded-xl shadow-lg p-8 text-center">
          <svg class="mx-auto h-16 w-16 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
          <div class="text-left max-w-2xl mx-auto mb-6 space-y-3">
            <p class="text-gray-700" *ngIf="quiz.instructions">{{ quiz.instructions }}</p>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p class="font-semibold text-blue-900 mb-2">Important Instructions:</p>
              <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>This quiz contains {{ quiz.questions.length }} questions</li>
                <li *ngIf="hasTimeLimit">You have {{ quiz.quizSettings.timeLimit }} minutes to complete</li>
                <li *ngIf="!hasTimeLimit">No time limit - take your time</li>
                <li>Answer all questions before submitting</li>
                <li>You cannot change answers after submission</li>
              </ul>
            </div>
          </div>
          <button 
            (click)="startQuiz()"
            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105">
            <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Start Quiz
          </button>
        </div>

        <!-- Quiz Questions -->
        <div *ngIf="!loading && quiz && started && !submitted">
          <!-- Progress Bar -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Progress</span>
              <span class="text-sm font-medium text-gray-700">{{ getAnsweredCount() }} / {{ quiz.questions.length }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300" 
                   [style.width.%]="(getAnsweredCount() / quiz.questions.length) * 100"></div>
            </div>
          </div>

          <!-- Current Question -->
          <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <span class="text-white font-bold text-lg">{{ currentQuestionIndex + 1 }}</span>
                </div>
                <div>
                  <h3 class="text-sm text-gray-600">Question {{ currentQuestionIndex + 1 }} of {{ quiz.questions.length }}</h3>
                  <p class="text-xs text-gray-500">{{ quiz.questions[currentQuestionIndex].points }} points</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <p class="text-xl text-gray-900 leading-relaxed">{{ quiz.questions[currentQuestionIndex].question }}</p>
            </div>

            <div class="space-y-3">
              <label *ngFor="let option of quiz.questions[currentQuestionIndex].options; let i = index"
                     class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all"
                     [ngClass]="{
                       'border-blue-500 bg-blue-50': answers[currentQuestionIndex] === i,
                       'border-gray-200 hover:border-blue-300 hover:bg-gray-50': answers[currentQuestionIndex] !== i
                     }">
                <input 
                  type="radio" 
                  [name]="'question-' + currentQuestionIndex"
                  [value]="i"
                  [(ngModel)]="answers[currentQuestionIndex]"
                  class="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full font-semibold text-gray-700">
                      {{ ['A', 'B', 'C', 'D'][i] }}
                    </span>
                    <span class="text-gray-900">{{ option }}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Navigation -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between">
              <button 
                *ngIf="currentQuestionIndex > 0"
                (click)="previousQuestion()"
                class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>
              <div *ngIf="currentQuestionIndex === 0" class="w-24"></div>

              <div class="flex gap-2">
                <span *ngFor="let q of quiz.questions; let i = index"
                      (click)="goToQuestion(i)"
                      class="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all font-medium"
                      [ngClass]="{
                        'bg-blue-600 text-white': i === currentQuestionIndex,
                        'bg-green-100 text-green-700': i !== currentQuestionIndex && answers[i] !== undefined,
                        'bg-gray-100 text-gray-600 hover:bg-gray-200': i !== currentQuestionIndex && answers[i] === undefined
                      }">
                  {{ i + 1 }}
                </span>
              </div>

              <div class="flex gap-3">
                <button 
                  *ngIf="currentQuestionIndex < quiz.questions.length - 1"
                  (click)="nextQuestion()"
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  Next
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                <button 
                  *ngIf="currentQuestionIndex === quiz.questions.length - 1"
                  (click)="submitQuiz()"
                  [disabled]="!allQuestionsAnswered()"
                  class="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submission Success -->
        <div *ngIf="submitted" class="bg-white rounded-xl shadow-lg p-8 text-center">
          <svg class="mx-auto h-16 w-16 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Quiz Submitted Successfully!</h2>
          <p class="text-gray-600 mb-6">Your answers have been recorded and will be graded.</p>
          <button 
            (click)="goToResults()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            View Results
          </button>
        </div>
      </div>
    </div>
  `
})
export class QuizTakingComponent implements OnInit, OnDestroy {
  quiz: any = null;
  loading = false;
  started = false;
  submitted = false;
  currentQuestionIndex = 0;
  answers: number[] = [];
  startTime: Date | null = null;
  
  // Timer
  hasTimeLimit = false;
  timeRemaining = 0; // seconds
  timerInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const assignmentId = this.route.snapshot.paramMap.get('id');
    if (assignmentId) {
      this.loadQuiz(assignmentId);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadQuiz(assignmentId: string): void {
    this.loading = true;
    this.assignmentService.getQuiz(assignmentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.quiz = response.data.quiz;
          this.answers = new Array(this.quiz.questions.length).fill(undefined);
          
          if (this.quiz.quizSettings?.timeLimit) {
            this.hasTimeLimit = true;
            this.timeRemaining = this.quiz.quizSettings.timeLimit * 60; // convert to seconds
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/assignments']);
      }
    });
  }

  startQuiz(): void {
    this.started = true;
    this.startTime = new Date();
    
    if (this.hasTimeLimit) {
      this.startTimer();
    }
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  timeUp(): void {
    clearInterval(this.timerInterval);
    this.toastService.warning('Time is up! Submitting quiz...');
    setTimeout(() => this.submitQuiz(), 2000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  getAnsweredCount(): number {
    return this.answers.filter(a => a !== undefined).length;
  }

  allQuestionsAnswered(): boolean {
    return this.answers.every(a => a !== undefined);
  }

  submitQuiz(): void {
    if (!this.allQuestionsAnswered()) {
      this.toastService.warning('Please answer all questions before submitting');
      return;
    }

    this.confirmationService.confirm({
      title: 'Submit Quiz',
      message: 'Are you sure you want to submit? You cannot change your answers after submission.',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (confirmed) {
        this.performSubmission();
      }
    });
  }

  performSubmission(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const endTime = new Date();
    const payload = {
      answers: this.answers.map((selectedOptionIndex, questionIndex) => ({
        questionIndex,
        selectedOptionIndex
      })),
      startTime: this.startTime?.toISOString(),
      endTime: endTime.toISOString()
    };

    this.assignmentService.submitQuiz(this.quiz._id, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.submitted = true;
          this.toastService.success('Quiz submitted successfully!');
          
          // Store submission ID for results page
          if (response.data?.submission?._id) {
            sessionStorage.setItem('lastSubmissionId', response.data.submission._id);
          }
        }
      },
      error: (error) => {
        this.toastService.showApiError(error);
      }
    });
  }

  goToResults(): void {
    const submissionId = sessionStorage.getItem('lastSubmissionId');
    if (submissionId) {
      this.router.navigate(['/dashboard/assignments', this.quiz._id, 'quiz-results', submissionId]);
    } else {
      this.router.navigate(['/dashboard/assignments']);
    }
  }
}

