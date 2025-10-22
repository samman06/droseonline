import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalyticsService, TeacherOverview } from '../services/analytics.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
              <p class="text-blue-100 text-lg">Performance insights and metrics</p>
            </div>
            <div class="text-white text-right">
              <p class="text-sm opacity-80">Teacher</p>
              <p class="text-xl font-semibold">{{ currentUser?.fullName }}</p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- KPI Cards -->
        <div *ngIf="!isLoading && overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Students -->
          <div class="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Total Students</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ overview.totalStudents }}</p>
              </div>
              <div class="p-3 bg-blue-100 rounded-full">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Average Grade -->
          <div class="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Average Grade</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ overview.averageGrade }}%</p>
              </div>
              <div class="p-3 bg-green-100 rounded-full">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Attendance Rate -->
          <div class="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Attendance Rate</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ overview.averageAttendanceRate }}%</p>
              </div>
              <div class="p-3 bg-purple-100 rounded-full">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Pending Grading -->
          <div class="bg-white rounded-xl shadow-lg border-l-4 border-orange-500 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 font-medium">Pending Grading</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ overview.pendingGrading }}</p>
              </div>
              <div class="p-3 bg-orange-100 rounded-full">
                <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div *ngIf="!isLoading && overview" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📚 Course Overview</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Total Courses</span>
                <span class="text-xl font-bold text-blue-600">{{ overview.totalCourses }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Total Groups</span>
                <span class="text-xl font-bold text-blue-600">{{ overview.totalGroups }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Total Assignments</span>
                <span class="text-xl font-bold text-blue-600">{{ overview.totalAssignments }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 Recent Activity</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">New Submissions</span>
                <span class="text-xl font-bold text-green-600">{{ overview.recentActivity.submissions }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Graded</span>
                <span class="text-xl font-bold text-green-600">{{ overview.recentActivity.graded }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Attendance Marked</span>
                <span class="text-xl font-bold text-green-600">{{ overview.recentActivity.attendanceMarked }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">⚠️ Attention Needed</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Pending Grading</span>
                <span class="text-xl font-bold text-orange-600">{{ overview.pendingGrading }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Late Submissions</span>
                <span class="text-xl font-bold text-red-600">{{ overview.lateSubmissionRate }}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Avg. Attendance</span>
                <span class="text-xl font-bold" [class]="getAttendanceColorClass()">{{ overview.averageAttendanceRate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row 1 -->
        <div *ngIf="!isLoading && overview" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Performance Overview Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Performance Overview</h3>
            <canvas #performanceChart class="max-h-64"></canvas>
          </div>

          <!-- Grade Distribution Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Grade Distribution</h3>
            <canvas #gradeChart class="max-h-64"></canvas>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div *ngIf="!isLoading && overview" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Submission Status Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 Submission Status</h3>
            <canvas #submissionChart class="max-h-64"></canvas>
          </div>

          <!-- Attendance Trends Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📅 Attendance Trends</h3>
            <canvas #attendanceChart class="max-h-64"></canvas>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class AnalyticsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gradeChart') gradeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('submissionChart') submissionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef<HTMLCanvasElement>;

  overview: TeacherOverview | null = null;
  isLoading = false;
  currentUser: any;

  private charts: Chart[] = [];

  constructor(
    private analyticsService: AnalyticsService,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.analyticsService.getTeacherOverview().subscribe({
      next: (response) => {
        if (response.success && response.data?.overview) {
          this.overview = response.data.overview;
          // Wait for next tick to ensure canvas elements are rendered
          setTimeout(() => this.createCharts(), 100);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.toastService.error('Failed to load analytics data');
        this.isLoading = false;
      }
    });
  }

  createCharts(): void {
    if (!this.overview) return;

    this.createPerformanceChart();
    this.createGradeDistributionChart();
    this.createSubmissionStatusChart();
    this.createAttendanceTrendsChart();
  }

  private createPerformanceChart(): void {
    if (!this.performanceChartRef?.nativeElement) return;

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: ['Grade Average', 'Attendance', 'Submissions', 'On-Time Rate', 'Engagement'],
        datasets: [{
          label: 'Performance Metrics',
          data: [
            this.overview!.averageGrade,
            this.overview!.averageAttendanceRate,
            this.calculateSubmissionRate(),
            100 - parseFloat(this.overview!.lateSubmissionRate.toString()),
            this.calculateEngagementScore()
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(99, 102, 241)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createGradeDistributionChart(): void {
    if (!this.gradeChartRef?.nativeElement) return;

    const ctx = this.gradeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Simulate grade distribution data
    const avgGrade = this.overview!.averageGrade;
    const excellent = Math.max(0, Math.min(40, avgGrade - 60));
    const good = Math.max(0, Math.min(35, 100 - avgGrade));
    const average = Math.max(0, Math.min(20, 80 - avgGrade));
    const poor = Math.max(0, 100 - excellent - good - average);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Excellent (90-100)', 'Good (75-89)', 'Average (60-74)', 'Needs Improvement (<60)'],
        datasets: [{
          data: [excellent, good, average, poor],
          backgroundColor: [
            'rgb(34, 197, 94)',   // Green
            'rgb(59, 130, 246)',  // Blue
            'rgb(234, 179, 8)',   // Yellow
            'rgb(239, 68, 68)'    // Red
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 11
              }
            }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createSubmissionStatusChart(): void {
    if (!this.submissionChartRef?.nativeElement) return;

    const ctx = this.submissionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const totalAssignments = this.overview!.totalAssignments * this.overview!.totalStudents;
    const submittedRate = this.calculateSubmissionRate();
    const submitted = Math.round((totalAssignments * submittedRate) / 100);
    const pending = totalAssignments - submitted;

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Submitted', 'Pending', 'Graded'],
        datasets: [{
          data: [submitted - this.overview!.pendingGrading, pending, this.overview!.pendingGrading],
          backgroundColor: [
            'rgb(34, 197, 94)',   // Green
            'rgb(251, 191, 36)',  // Amber
            'rgb(59, 130, 246)'   // Blue
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 11
              }
            }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createAttendanceTrendsChart(): void {
    if (!this.attendanceChartRef?.nativeElement) return;

    const ctx = this.attendanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Simulate attendance trend data
    const attendanceRate = this.overview!.averageAttendanceRate;
    const trendData = this.generateTrendData(attendanceRate, 7);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.getLast7Days(),
        datasets: [{
          label: 'Attendance Rate (%)',
          data: trendData,
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Attendance: ' + context.parsed.y.toFixed(1) + '%';
              }
            }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private calculateSubmissionRate(): number {
    if (!this.overview) return 0;
    // Simulated calculation
    return Math.max(60, Math.min(95, this.overview.averageGrade - 10));
  }

  private calculateEngagementScore(): number {
    if (!this.overview) return 0;
    // Engagement score based on multiple factors
    const gradeWeight = this.overview.averageGrade * 0.4;
    const attendanceWeight = this.overview.averageAttendanceRate * 0.4;
    const submissionWeight = this.calculateSubmissionRate() * 0.2;
    return Math.round(gradeWeight + attendanceWeight + submissionWeight);
  }

  private generateTrendData(baseValue: number, days: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < days; i++) {
      // Add some randomness while keeping close to base value
      const variance = (Math.random() - 0.5) * 10;
      data.push(Math.max(60, Math.min(100, baseValue + variance)));
    }
    return data;
  }

  private getLast7Days(): string[] {
    const days: string[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(dayNames[date.getDay()]);
    }
    return days;
  }

  getAttendanceColorClass(): string {
    if (!this.overview) return 'text-gray-600';
    const rate = this.overview.averageAttendanceRate;
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  ngOnDestroy(): void {
    // Cleanup charts
    this.charts.forEach(chart => chart.destroy());
  }
}

