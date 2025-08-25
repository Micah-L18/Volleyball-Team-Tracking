import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { ProgressData } from '../../services/analytics.service';

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController
);

@Component({
  selector: 'app-progress-tracking',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <span class="text-purple-500 mr-2">📈</span>
          Progress Tracking
        </h3>
        <div class="flex gap-2">
          <button *ngFor="let period of timePeriods"
                  (click)="onTimeframeChange(period.value)"
                  [class.bg-blue-50]="selectedTimeframe === period.value"
                  [class.border-blue-200]="selectedTimeframe === period.value"
                  [class.text-blue-700]="selectedTimeframe === period.value"
                  class="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            {{ period.label }}
          </button>
        </div>
      </div>

      <div *ngIf="progressData.length === 0" class="text-gray-500 text-center py-8">
        <div class="mb-2">📊</div>
        <p>No progress data available yet.</p>
        <p class="text-sm">Historical progress will appear as you continue rating players over time.</p>
      </div>

      <div *ngIf="progressData.length > 0" class="space-y-6">
        <!-- Progress Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-900">Current Average</p>
                <p class="text-2xl font-bold text-blue-700">{{ getCurrentAverage() }}/5.0</p>
              </div>
              <div class="text-blue-600">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-900">Improvement</p>
                <p class="text-2xl font-bold text-green-700">{{ getImprovementTrend() }}</p>
                <p class="text-xs text-green-600">{{ getImprovementDirection() }}</p>
              </div>
              <div class="text-green-600">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-900">Total Ratings</p>
                <p class="text-2xl font-bold text-purple-700">{{ getTotalRatings() }}</p>
                <p class="text-xs text-purple-600">Across all months</p>
              </div>
              <div class="text-purple-600">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Chart -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Team Progress Over Time</h4>
          <div class="h-80">
            <canvas 
              baseChart
              [data]="chartData"
              [options]="chartOptions"
              [type]="chartType">
            </canvas>
          </div>
        </div>

        <!-- Progress Details Table -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Monthly Breakdown</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 font-medium text-gray-900">Month</th>
                  <th class="text-center py-2 px-3 font-medium text-gray-900">Average Rating</th>
                  <th class="text-center py-2 px-3 font-medium text-gray-900">Skills Rated</th>
                  <th class="text-center py-2 px-3 font-medium text-gray-900">Players Active</th>
                  <th class="text-center py-2 px-3 font-medium text-gray-900">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let data of progressData; let i = index" class="border-b border-gray-100">
                  <td class="py-3 px-3 font-medium text-gray-900">{{ data.month }}</td>
                  <td class="text-center py-3 px-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="getRatingClass(data.averageRating)">
                      {{ data.averageRating }}/5.0
                    </span>
                  </td>
                  <td class="text-center py-3 px-3 text-gray-700">{{ data.skillsRated }}</td>
                  <td class="text-center py-3 px-3 text-gray-700">{{ data.playersRated }}</td>
                  <td class="text-center py-3 px-3">
                    <span class="inline-flex items-center text-xs"
                          [class]="getChangeClass(getMonthlyChange(i))">
                      {{ getMonthlyChange(i) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProgressTrackingComponent implements OnInit, OnChanges {
  @Input() progressData: ProgressData[] = [];
  @Input() selectedTimeframe: string = '6months';

  timePeriods = [
    { label: '3M', value: '3months' },
    { label: '6M', value: '6months' },
    { label: '1Y', value: '1year' }
  ];

  chartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            if (label === 'Average Rating') {
              return `${label}: ${context.parsed.y}/5.0`;
            }
            return `${label}: ${context.parsed.y}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  chartType: ChartType = 'line';

  ngOnInit(): void {
    this.setupChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progressData']) {
      this.setupChartData();
    }
  }

  onTimeframeChange(timeframe: string): void {
    // This would trigger a parent component to fetch new data
    // For now, we'll just update the selected timeframe
    this.selectedTimeframe = timeframe;
  }

  private setupChartData(): void {
    if (this.progressData.length === 0) return;

    this.chartData = {
      labels: this.progressData.map(d => d.month),
      datasets: [
        {
          label: 'Average Rating',
          data: this.progressData.map(d => d.averageRating),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Skills Rated',
          data: this.progressData.map(d => d.skillsRated),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    };

    // Update chart options for dual y-axis
    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 0.5
          },
          title: {
            display: true,
            text: 'Average Rating'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Skills Rated'
          },
          grid: {
            drawOnChartArea: false,
          }
        }
      }
    };
  }

  getCurrentAverage(): string {
    if (this.progressData.length === 0) return '0.0';
    const latest = this.progressData[this.progressData.length - 1];
    return latest.averageRating.toFixed(1);
  }

  getImprovementTrend(): string {
    if (this.progressData.length < 2) return '0.0';
    const latest = this.progressData[this.progressData.length - 1];
    const previous = this.progressData[this.progressData.length - 2];
    const change = latest.averageRating - previous.averageRating;
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  }

  getImprovementDirection(): string {
    if (this.progressData.length < 2) return 'No data';
    const latest = this.progressData[this.progressData.length - 1];
    const previous = this.progressData[this.progressData.length - 2];
    const change = latest.averageRating - previous.averageRating;
    
    if (change > 0.1) return 'Improving';
    if (change < -0.1) return 'Declining';
    return 'Stable';
  }

  getTotalRatings(): number {
    return this.progressData.reduce((sum, data) => sum + data.skillsRated, 0);
  }

  getMonthlyChange(index: number): string {
    if (index === 0 || this.progressData.length < 2) return '--';
    const current = this.progressData[index];
    const previous = this.progressData[index - 1];
    const change = current.averageRating - previous.averageRating;
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  }

  getRatingClass(rating: number): string {
    if (rating >= 4.0) return 'bg-green-100 text-green-800';
    if (rating >= 3.0) return 'bg-yellow-100 text-yellow-800';
    if (rating >= 2.0) return 'bg-orange-100 text-orange-800';
    if (rating > 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  getChangeClass(change: string): string {
    if (change === '--') return 'text-gray-500';
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  }
}
