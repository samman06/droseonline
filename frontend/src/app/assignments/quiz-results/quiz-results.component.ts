import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4">
      <div class="max-w-5xl mx-auto">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          <p class="mt-4 text-gray-600 font-medium">Loading results...</p>
        </div>

        <!-- Results Not Available -->
        <div *ngIf="!loading && !results" class="bg-white rounded-xl shadow-lg p-8 text-center">
          <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Results Not Available Yet</h2>
          <p class="text-gray-600 mb-6">{{ errorMessage || 'The teacher has not released the results yet.' }}</p>
          <button 
            (click)="goBack()"
            class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
            Go Back
          </button>
        </div>

        <!-- Results Available -->
        <div *ngIf="!loading && results">
          
          <!-- Score Card -->
          <div class="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-4xl font-bold mb-2">Quiz Results</h1>
                <p class="text-purple-100">Submitted on {{ results.submission.submittedAt | date:'medium' }}</p>
                <p *ngIf="results.submission.timeSpent" class="text-purple-100 text-sm mt-1">
                  Time Taken: {{ formatTime(results.submission.timeSpent) }}
                  <span *ngIf="results.submission.timeLimitExceeded" class="text-yellow-300 ml-2">⚠ Time Limit Exceeded</span>
                </p>
              </div>
              
              <!-- Score Circle -->
              <div class="flex flex-col items-center">
                <div class="relative w-36 h-36">
                  <svg class="transform -rotate-90 w-36 h-36">
                    <circle cx="72" cy="72" r="60" stroke="rgba(255,255,255,0.2)" stroke-width="12" fill="none"/>
                    <circle cx="72" cy="72" r="60" 
                            [attr.stroke]="getScoreColor(results.grade.percentage)"
                            stroke-width="12" fill="none" stroke-linecap="round"
                            [attr.stroke-dasharray]="2 * Math.PI * 60"
                            [attr.stroke-dashoffset]="2 * Math.PI * 60 * (1 - results.grade.percentage / 100)"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-4xl font-bold">{{ results.grade.percentage }}%</span>
                    <span class="text-sm text-purple-100">{{ results.grade.pointsEarned }} / {{ results.grade.maxPoints }}</span>
                  </div>
                </div>
                <div class="mt-3 px-4 py-2 rounded-full text-sm font-bold"
                     [ngClass]="getGradeClass(results.grade.percentage)">
                  {{ getGradeLabel(results.grade.percentage) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Correct Answers</p>
                  <p class="text-3xl font-bold text-green-600">{{ getCorrectCount() }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-xl">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Incorrect Answers</p>
                  <p class="text-3xl font-bold text-red-600">{{ getIncorrectCount() }}</p>
                </div>
                <div class="p-3 bg-red-100 rounded-xl">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Questions</p>
                  <p class="text-3xl font-bold text-indigo-600">{{ results.answers.length }}</p>
                </div>
                <div class="p-3 bg-indigo-100 rounded-xl">
                  <svg class="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Question-by-Question Review -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Review Answers</h2>
            
            <div class="space-y-6">
              <div *ngFor="let answer of results.answers; let i = index"
                   class="border-2 rounded-xl p-6 transition-all"
                   [ngClass]="{
                     'border-green-300 bg-green-50': answer.isCorrect,
                     'border-red-300 bg-red-50': !answer.isCorrect
                   }">
                
                <!-- Question Header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-10 h-10 rounded-xl shadow-md"
                         [ngClass]="{
                           'bg-green-500 text-white': answer.isCorrect,
                           'bg-red-500 text-white': !answer.isCorrect
                         }">
                      <span class="font-bold text-lg">{{ answer.questionNumber }}</span>
                    </div>
                    <div>
                      <span class="text-xs font-semibold px-2 py-1 rounded-full"
                            [ngClass]="{
                              'bg-green-200 text-green-800': answer.isCorrect,
                              'bg-red-200 text-red-800': !answer.isCorrect
                            }">
                        {{ answer.isCorrect ? 'Correct' : 'Incorrect' }}
                      </span>
                      <p class="text-xs text-gray-600 mt-1">{{ answer.pointsEarned }} / {{ answer.pointsPossible }} points</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold"
                         [ngClass]="{
                           'text-green-600': answer.isCorrect,
                           'text-red-600': !answer.isCorrect
                         }">
                      <svg *ngIf="answer.isCorrect" class="w-8 h-8 inline-block" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <svg *ngIf="!answer.isCorrect" class="w-8 h-8 inline-block" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Question Text -->
                <div class="mb-4">
                  <p class="text-lg text-gray-900 font-medium">{{ answer.question }}</p>
                </div>

                <!-- Your Answer -->
                <div class="mb-3 p-4 rounded-lg"
                     [ngClass]="{
                       'bg-green-100 border-2 border-green-300': answer.isCorrect,
                       'bg-red-100 border-2 border-red-300': !answer.isCorrect
                     }">
                  <p class="text-sm font-semibold mb-1"
                     [ngClass]="{
                       'text-green-800': answer.isCorrect,
                       'text-red-800': !answer.isCorrect
                     }">
                    Your Answer:
                  </p>
                  <div class="flex items-center gap-2">
                    <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-full font-semibold text-gray-700">
                      {{ ['A', 'B', 'C', 'D'][answer.selectedOptionIndex] }}
                    </span>
                    <p class="text-gray-900">{{ answer.selectedOption }}</p>
                  </div>
                </div>

                <!-- Correct Answer (if wrong) -->
                <div *ngIf="!answer.isCorrect" class="mb-3 p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                  <p class="text-sm font-semibold text-green-800 mb-1">Correct Answer:</p>
                  <div class="flex items-center gap-2">
                    <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-full font-semibold text-gray-700">
                      {{ ['A', 'B', 'C', 'D'][answer.correctAnswerIndex] }}
                    </span>
                    <p class="text-gray-900">{{ answer.correctAnswer }}</p>
                  </div>
                </div>

                <!-- Explanation -->
                <div *ngIf="answer.explanation" class="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p class="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                  <p class="text-sm text-blue-800">{{ answer.explanation }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex justify-center gap-4">
            <button 
              (click)="goBack()"
              class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
              Back to Assignments
            </button>
            <button 
              (click)="printResults()"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QuizResultsComponent implements OnInit {
  results: any = null;
  loading = false;
  errorMessage = '';
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const assignmentId = this.route.snapshot.paramMap.get('id');
    const submissionId = this.route.snapshot.paramMap.get('submissionId');
    
    if (assignmentId && submissionId) {
      this.loadResults(assignmentId, submissionId);
    }
  }

  loadResults(assignmentId: string, submissionId: string): void {
    this.loading = true;
    this.assignmentService.getQuizResults(assignmentId, submissionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.results = response.data.results;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load quiz results';
        this.loading = false;
      }
    });
  }

  getCorrectCount(): number {
    return this.results?.answers.filter((a: any) => a.isCorrect).length || 0;
  }

  getIncorrectCount(): number {
    return this.results?.answers.filter((a: any) => !a.isCorrect).length || 0;
  }

  getScoreColor(percentage: number): string {
    if (percentage >= 90) return '#10b981'; // green
    if (percentage >= 80) return '#3b82f6'; // blue
    if (percentage >= 70) return '#f59e0b'; // yellow
    if (percentage >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  getGradeClass(percentage: number): string {
    if (percentage >= 90) return 'bg-green-500 text-white';
    if (percentage >= 80) return 'bg-blue-500 text-white';
    if (percentage >= 70) return 'bg-yellow-500 text-white';
    if (percentage >= 60) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  }

  getGradeLabel(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Pass';
    return 'Needs Improvement';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  printResults(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

