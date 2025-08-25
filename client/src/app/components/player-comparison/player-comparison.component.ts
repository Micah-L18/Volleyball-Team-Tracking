import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PlayerComparison } from '../../services/analytics.service';

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  BarElement,
  BarController
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  BarElement,
  BarController
);

@Component({
  selector: 'app-player-comparison',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <span class="text-blue-500 mr-2">👥</span>
        Player Comparison
      </h3>

      <div *ngIf="players.length === 0" class="text-gray-500 text-center py-8">
        No player data available for comparison. Rate more players to see comparisons.
      </div>

      <div *ngIf="players.length > 0" class="space-y-8">
        <!-- Player Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let player of players" 
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-900">{{ player.playerName }}</h4>
              <span class="text-lg font-bold text-blue-600">{{ player.overallAverage }}/5.0</span>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Skills Rated:</span>
                <span class="font-medium">{{ player.totalSkillsRated }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Strength:</span>
                <span class="font-medium text-green-600">{{ player.strengthCategory }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Focus Area:</span>
                <span class="font-medium text-orange-600">{{ player.weakestCategory }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Comparison Chart -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Overall Average Comparison</h4>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="chartData"
              [options]="chartOptions"
              [type]="chartType">
            </canvas>
          </div>
        </div>

        <!-- Category Comparison -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Category Breakdown</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 font-medium text-gray-900">
                    <button (click)="sortByColumn('playerName')" 
                            class="flex items-center hover:text-blue-600 transition-colors">
                      Player
                      <span class="ml-1 text-xs" *ngIf="sortColumn === 'playerName'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                      <span class="ml-1 text-xs text-gray-400" *ngIf="sortColumn !== 'playerName'">
                        ⇅
                      </span>
                    </button>
                  </th>
                  <th *ngFor="let category of categories" 
                      class="text-center py-2 px-3 font-medium text-gray-900">
                    <button (click)="sortByColumn(category)" 
                            class="flex items-center justify-center hover:text-blue-600 transition-colors">
                      {{ category }}
                      <span class="ml-1 text-xs" *ngIf="sortColumn === category">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                      <span class="ml-1 text-xs text-gray-400" *ngIf="sortColumn !== category">
                        ⇅
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let player of sortedPlayers" class="border-b border-gray-100">
                  <td class="py-3 px-3 font-medium text-gray-900">{{ player.playerName }}</td>
                  <td *ngFor="let category of categories" 
                      class="text-center py-3 px-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="getCategoryRatingClass(getCategoryValue(player, category))">
                      {{ getCategoryDisplayValue(player, category) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Skills per Player -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div *ngFor="let player of players.slice(0, 4)" 
               class="border border-gray-200 rounded-lg p-4">
            <h5 class="font-medium text-gray-900 mb-3">{{ player.playerName }} - Top Skills</h5>
            <div class="space-y-2">
              <div *ngFor="let skill of getTopSkills(player)" 
                   class="flex items-center justify-between">
                <span class="text-sm text-gray-700">{{ skill.skillName }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ skill.rating }}/5.0</span>
                  <span class="text-xs text-gray-500">#{{ skill.rank }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PlayerComparisonComponent implements OnInit, OnChanges {
  @Input() players: PlayerComparison[] = [];

  categories: string[] = [];
  sortedPlayers: PlayerComparison[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
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
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}/5.0`
        }
      }
    }
  };
  chartType: ChartType = 'bar';

  ngOnInit(): void {
    this.setupComparisonData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['players']) {
      console.log('Player data received:', this.players);
      this.setupComparisonData();
    }
  }

  private setupComparisonData(): void {
    if (this.players.length === 0) return;

    console.log('Setting up comparison data for players:', this.players);

    // Extract unique categories
    const categorySet = new Set<string>();
    this.players.forEach(player => {
      console.log(`Player ${player.playerName} categoryAverages:`, player.categoryAverages);
      Object.keys(player.categoryAverages || {}).forEach(cat => categorySet.add(cat));
    });
    this.categories = Array.from(categorySet).sort();
    
    console.log('Available categories:', this.categories);

    // Initialize sorted players
    this.sortedPlayers = [...this.players];
    
    // Sort by player name by default
    if (!this.sortColumn) {
      this.sortColumn = 'playerName';
      this.applySorting();
    } else {
      this.applySorting();
    }

    // Setup chart data
    this.chartData = {
      labels: this.players.map(p => p.playerName),
      datasets: [{
        label: 'Overall Average',
        data: this.players.map(p => p.overallAverage),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }

  getTopSkills(player: PlayerComparison): any[] {
    return (player.skills || [])
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }

  getCategoryValue(player: PlayerComparison, category: string): number {
    return (player.categoryAverages && player.categoryAverages[category]) || 0;
  }

  getCategoryDisplayValue(player: PlayerComparison, category: string): string {
    const value = this.getCategoryValue(player, category);
    return value > 0 ? value.toFixed(1) : 'N/A';
  }

  getCategoryRatingClass(rating: number): string {
    if (rating >= 4.0) return 'bg-green-100 text-green-800';
    if (rating >= 3.0) return 'bg-yellow-100 text-yellow-800';
    if (rating >= 2.0) return 'bg-orange-100 text-orange-800';
    if (rating > 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  sortByColumn(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.sortedPlayers = [...this.players].sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      if (this.sortColumn === 'playerName') {
        valueA = a.playerName.toLowerCase();
        valueB = b.playerName.toLowerCase();
      } else {
        // Category column
        valueA = this.getCategoryValue(a, this.sortColumn);
        valueB = this.getCategoryValue(b, this.sortColumn);
      }

      let comparison = 0;
      if (valueA < valueB) {
        comparison = -1;
      } else if (valueA > valueB) {
        comparison = 1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}
