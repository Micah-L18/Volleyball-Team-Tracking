import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnalyticsService, TeamAnalytics, InsightData } from '../../services/analytics.service';
import { Team } from '../../models/types';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Team Analytics</h2>
        <div class="flex gap-2">
          <button
            (click)="refreshAnalytics()"
            [disabled]="loading"
            class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button
            (click)="exportReport()"
            [disabled]="loading || !analytics"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            Export Report
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Analytics Content -->
      <div *ngIf="!loading && analytics" class="space-y-8">
        <!-- Key Insights -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let insight of insights" 
               class="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 border border-gray-200">
            <div class="flex items-center">
              <span class="text-2xl mr-3">{{ insight.icon }}</span>
              <div>
                <p class="text-sm font-medium text-gray-600">{{ insight.title }}</p>
                <p class="text-lg font-bold" [class]="insight.color">{{ insight.value }}</p>
                <p class="text-xs text-gray-500">{{ insight.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-blue-50 rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-blue-900">{{ analytics.overallTeamAverage }}/5.0</p>
                <p class="text-blue-700">Overall Team Average</p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-green-900">{{ analytics.totalPlayers }}</p>
                <p class="text-green-700">Total Players</p>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-purple-900">{{ analytics.totalSkillsRated }}</p>
                <p class="text-purple-700">Skills Rated</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Strengths and Improvement Areas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Strengths -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span class="text-green-500 mr-2">💪</span>
              Top Strengths
            </h3>
            <div *ngIf="analytics.topStrengths.length === 0" class="text-gray-500 text-center py-8">
              No strengths identified yet. Rate more skills to see team strengths.
            </div>
            <div class="space-y-3">
              <div *ngFor="let strength of analytics.topStrengths; let i = index" 
                   class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{{ strength.skillName }}</p>
                  <p class="text-sm text-gray-600">{{ strength.category }}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-green-600">{{ strength.averageRating }}/5.0</p>
                  <p class="text-xs text-gray-500">{{ strength.playerCount }} players</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Improvement Areas -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span class="text-orange-500 mr-2">🎯</span>
              Focus Areas
            </h3>
            <div *ngIf="analytics.improvementAreas.length === 0" class="text-gray-500 text-center py-8">
              Great job! No significant improvement areas identified.
            </div>
            <div class="space-y-3">
              <div *ngFor="let area of analytics.improvementAreas; let i = index" 
                   class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{{ area.skillName }}</p>
                  <p class="text-sm text-gray-600">{{ area.category }}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-orange-600">{{ area.averageRating }}/5.0</p>
                  <p class="text-xs text-gray-500">{{ area.playerCount }} players</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Performance by Category</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div *ngFor="let category of analytics.categoryBreakdown" 
                 class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900">{{ category.category }}</h4>
                <span class="text-lg font-bold" 
                      [class]="getCategoryRatingColor(category.averageRating)">
                  {{ category.averageRating || 'N/A' }}
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div class="h-2 rounded-full" 
                     [class]="getCategoryProgressColor(category.averageRating)"
                     [style.width.%]="(category.averageRating / 5) * 100">
                </div>
              </div>
              
              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Completion:</span>
                  <span>{{ category.completionPercentage.toFixed(0) }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Skills:</span>
                  <span>{{ category.ratedSkillCount }}/{{ category.skillCount }}</span>
                </div>
                <div *ngIf="category.topSkill !== 'None rated'">
                  <p class="text-xs text-green-600">Top: {{ category.topSkill }}</p>
                </div>
                <div *ngIf="category.weakestSkill !== 'None rated' && category.ratedSkillCount > 1">
                  <p class="text-xs text-orange-600">Focus: {{ category.weakestSkill }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Recommendations -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="text-blue-500 mr-2">🏆</span>
            Coaching Recommendations
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <h4 class="font-medium text-blue-900">Strengths to Maintain:</h4>
              <ul class="text-sm text-gray-700 space-y-1">
                <li *ngFor="let strength of analytics.topStrengths.slice(0, 3)" 
                    class="flex items-center">
                  <span class="text-green-500 mr-2">✓</span>
                  Continue {{ strength.skillName }} excellence
                </li>
                <li *ngIf="analytics.topStrengths.length === 0" class="text-gray-500">
                  Rate more skills to see recommendations
                </li>
              </ul>
            </div>
            <div class="space-y-2">
              <h4 class="font-medium text-blue-900">Focus in Practice:</h4>
              <ul class="text-sm text-gray-700 space-y-1">
                <li *ngFor="let area of analytics.improvementAreas.slice(0, 3)" 
                    class="flex items-center">
                  <span class="text-orange-500 mr-2">→</span>
                  Drill {{ area.skillName }} fundamentals
                </li>
                <li *ngIf="analytics.improvementAreas.length === 0" class="text-gray-500">
                  Great job! Team shows balanced skills
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  @Input() team!: Team;

  analytics: TeamAnalytics | null = null;
  insights: InsightData[] = [];
  loading = false;
  error = '';

  private subscriptions: Subscription[] = [];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    if (this.team) {
      this.loadAnalytics();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAnalytics(): void {
    if (!this.team?.id) return;
    
    this.loading = true;
    this.error = '';

    const sub = this.analyticsService.getTeamAnalytics(this.team.id).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.insights = this.analyticsService.generateInsights(analytics);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = 'Failed to load team analytics';
        this.loading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  refreshAnalytics(): void {
    this.loadAnalytics();
  }

  exportReport(): void {
    if (!this.analytics || !this.team?.id) return;

    const sub = this.analyticsService.exportTeamReport(this.team.id, this.team.name || 'Team').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(this.team.name || 'Team').replace(/\s+/g, '_')}_Analytics_Report.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.error = 'Failed to export report';
      }
    });

    this.subscriptions.push(sub);
  }

  getCategoryRatingColor(rating: number): string {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    if (rating >= 2.0) return 'text-orange-600';
    if (rating > 0) return 'text-red-600';
    return 'text-gray-400';
  }

  getCategoryProgressColor(rating: number): string {
    if (rating >= 4.0) return 'bg-green-500';
    if (rating >= 3.0) return 'bg-yellow-500';
    if (rating >= 2.0) return 'bg-orange-500';
    if (rating > 0) return 'bg-red-500';
    return 'bg-gray-300';
  }
}
