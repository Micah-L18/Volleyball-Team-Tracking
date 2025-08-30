import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

// Player interface
export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  team_id: number;
  status: string;
}

// Statistic interface matching database schema
export interface Statistic {
  id: number;
  player_id?: number;
  event_id: number;
  category: string;
  subcategory: string;
  name: string;
  label?: string;
  value: number;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  stat_category: string;
  stat_name: string;
  stat_value: number;
  stat_date: string;
  game_type?: string;
  opponent?: string;
  set_number?: number;
  notes?: string;
  // Player info fields for joined queries
  first_name?: string;
  last_name?: string;
  player_name?: string;
  jersey_number?: number;
  position?: string;
}

// Schedule event interface
export interface ScheduleEvent {
  id: number;
  team_id: number;
  event_date: string;
  event_time: string;
  event_type: 'game' | 'practice' | 'tournament';
  opponent: string | null;
  title?: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  home_away: 'home' | 'away' | null;
  created_at: string;
  updated_at: string;
}

// Statistics grouped by category
export interface StatisticCategory {
  category: string;
  stats: Statistic[];
}

// Grouped statistics for display
export interface GroupedStatistics {
  [category: string]: {
    [subcategory: string]: {
      [statName: string]: number;
    };
  };
}

// Summary statistics interface
export interface StatisticsSummary {
  totalStats: number;
  categories: string[];
  topPerformers: {
    [statName: string]: {
      player: Player;
      value: number;
    };
  };
}

// Statistics filters interface
export interface StatisticsFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  gameType?: string;
  opponent?: string;
  playerId?: number;
  eventId?: number;
}

// Statistics grouped by category
export interface StatisticCategory {
  category: string;
  name: string;
  label: string;
  stats: Statistic[];
}

// Statistic summary interface
export interface StatisticSummary {
  category: string;
  statName: string;
  stat_category: string;
  stat_name: string;
  totalValue: number;
  total_value: number;
  averageValue: number;
  average_value: number;
  maxValue: number;
  minValue: number;
  gamesPlayed: number;
  total_entries: number;
  trend?: 'positive' | 'negative' | 'stable';
  change?: string;
}

// Create statistic request interface
export interface CreateStatisticRequest {
  playerId?: number;
  teamId?: number;
  eventId?: number;
  statCategory: string;
  statName: string;
  statValue: number;
  statDate?: string;
  gameType?: string;
  opponent?: string;
  setNumber?: number;
  notes?: string;
}

// Bulk statistics request interface
export interface BulkStatisticsRequest {
  statistics: CreateStatisticRequest[];
}

// Schedule event interface
export interface ScheduleEvent {
  id: number;
  team_id: number;
  event_date: string;
  event_time: string;
  event_type: 'game' | 'practice' | 'tournament';
  opponent: string | null;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  home_away: 'home' | 'away' | null;
  created_at: string;
  updated_at: string;
}

// All players statistics interface
export interface AllPlayersStatistic {
  playerId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  eventDate: string;
  eventType: string;
  opponent: string;
  statistics: {
    [category: string]: {
      [subcategory: string]: {
        [statName: string]: number;
      };
    };
  };
}

// Bulk statistics response
export interface BulkStatisticsResponse {
  success: boolean;
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

// All players statistics response
export interface AllPlayersStatsResponse {
  statistics: AllPlayersStatistic[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private baseUrl = 'http://localhost:3002/api';
  private statisticsSubject = new BehaviorSubject<StatisticCategory[]>([]);
  public statistics$ = this.statisticsSubject.asObservable();
  
  // Categories subject for reactive updates
  private categoriesSubject = new BehaviorSubject<StatisticCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStatisticCategories();
  }

  // Get team statistics with filters
  getTeamStatistics(teamId: number, filters?: StatisticsFilters): Observable<Statistic[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.gameType) params = params.set('gameType', filters.gameType);
      if (filters.opponent) params = params.set('opponent', filters.opponent);
    }

    return this.http.get<Statistic[]>(`${this.baseUrl}/statistics/team/${teamId}`, { params });
  }

  // Get player statistics with filters
  getPlayerStatistics(playerId: number, filters?: StatisticsFilters): Observable<Statistic[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.gameType) params = params.set('gameType', filters.gameType);
      if (filters.opponent) params = params.set('opponent', filters.opponent);
    }

    return this.http.get<Statistic[]>(`${this.baseUrl}/statistics/player/${playerId}`, { params });
  }

  // Get player statistics summary
  getPlayerStatisticsSummary(playerId: number, startDate?: string, endDate?: string): Observable<StatisticSummary[]> {
    let params = new HttpParams().set('playerId', playerId.toString());
    
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<StatisticSummary[]>(`${this.baseUrl}/statistics/player/summary`, { params });
  }

  // Get events for statistics entry
  getEventsForStatistics(teamId: number): Observable<ScheduleEvent[]> {
    return this.http.get<ScheduleEvent[]>(`${this.baseUrl}/schedule/team/${teamId}`);
  }

  // Add single player statistic
  addPlayerStatistic(request: CreateStatisticRequest): Observable<Statistic> {
    return this.http.post<Statistic>(`${this.baseUrl}/statistics/player`, request);
  }

  // Add single team statistic
  addTeamStatistic(request: CreateStatisticRequest): Observable<Statistic> {
    return this.http.post<Statistic>(`${this.baseUrl}/statistics/team`, request);
  }

  // Add bulk player statistics
  addBulkPlayerStatistics(request: BulkStatisticsRequest): Observable<BulkStatisticsResponse> {
    return this.http.post<BulkStatisticsResponse>(`${this.baseUrl}/statistics/player/bulk`, request);
  }

  // Add bulk team statistics
  addBulkTeamStatistics(request: BulkStatisticsRequest): Observable<BulkStatisticsResponse> {
    return this.http.post<BulkStatisticsResponse>(`${this.baseUrl}/statistics/team/bulk`, request);
  }

  // Import statistics from file
  importStatistics(file: File, type: 'player' | 'team', targetId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('targetId', targetId.toString());

    return this.http.post(`${this.baseUrl}/statistics/import`, formData);
  }

  // Load statistic categories
  loadStatisticCategories(): void {
    this.http.get<StatisticCategory[]>(`${this.baseUrl}/statistics/categories`).subscribe({
      next: (categories) => {
        this.categoriesSubject.next(categories);
      },
      error: (error) => {
        console.error('Error loading statistic categories:', error);
        // Provide default categories if API fails
        this.categoriesSubject.next(this.getDefaultCategories());
      }
    });
  }

  // Get default categories if API is not available
  private getDefaultCategories(): StatisticCategory[] {
    return [
      {
        category: 'attacking',
        name: 'attacking',
        label: 'Attacking',
        stats: [
          { 
            id: 1, player_id: 0, event_id: 0, category: 'attacking', subcategory: 'kills', 
            name: 'Kills', label: 'Kills', value: 0, created_at: '', updated_at: '',
            stat_category: 'attacking', stat_name: 'Kills', stat_value: 0, stat_date: ''
          },
          { 
            id: 2, player_id: 0, event_id: 0, category: 'attacking', subcategory: 'attacks', 
            name: 'Attacks', label: 'Attacks', value: 0, created_at: '', updated_at: '',
            stat_category: 'attacking', stat_name: 'Attacks', stat_value: 0, stat_date: ''
          },
          { 
            id: 3, player_id: 0, event_id: 0, category: 'attacking', subcategory: 'errors', 
            name: 'Attack Errors', label: 'Attack Errors', value: 0, created_at: '', updated_at: '',
            stat_category: 'attacking', stat_name: 'Attack Errors', stat_value: 0, stat_date: ''
          }
        ]
      },
      {
        category: 'serving',
        name: 'serving',
        label: 'Serving',
        stats: [
          { 
            id: 4, player_id: 0, event_id: 0, category: 'serving', subcategory: 'aces', 
            name: 'Aces', label: 'Aces', value: 0, created_at: '', updated_at: '',
            stat_category: 'serving', stat_name: 'Aces', stat_value: 0, stat_date: ''
          },
          { 
            id: 5, player_id: 0, event_id: 0, category: 'serving', subcategory: 'errors', 
            name: 'Service Errors', label: 'Service Errors', value: 0, created_at: '', updated_at: '',
            stat_category: 'serving', stat_name: 'Service Errors', stat_value: 0, stat_date: ''
          }
        ]
      },
      {
        category: 'defending',
        name: 'defending',
        label: 'Defending',
        stats: [
          { 
            id: 6, player_id: 0, event_id: 0, category: 'defending', subcategory: 'digs', 
            name: 'Digs', label: 'Digs', value: 0, created_at: '', updated_at: '',
            stat_category: 'defending', stat_name: 'Digs', stat_value: 0, stat_date: ''
          },
          { 
            id: 7, player_id: 0, event_id: 0, category: 'defending', subcategory: 'blocks', 
            name: 'Blocks', label: 'Blocks', value: 0, created_at: '', updated_at: '',
            stat_category: 'defending', stat_name: 'Blocks', stat_value: 0, stat_date: ''
          }
        ]
      },
      {
        category: 'receiving',
        name: 'receiving',
        label: 'Receiving',
        stats: [
          { 
            id: 8, player_id: 0, event_id: 0, category: 'receiving', subcategory: 'passes', 
            name: 'Good Passes', label: 'Good Passes', value: 0, created_at: '', updated_at: '',
            stat_category: 'receiving', stat_name: 'Good Passes', stat_value: 0, stat_date: ''
          },
          { 
            id: 9, player_id: 0, event_id: 0, category: 'receiving', subcategory: 'errors', 
            name: 'Reception Errors', label: 'Reception Errors', value: 0, created_at: '', updated_at: '',
            stat_category: 'receiving', stat_name: 'Reception Errors', stat_value: 0, stat_date: ''
          }
        ]
      }
    ];
  }

  // Get statistics for a specific player and event (original method)
  getStatistics(playerId: number, eventId: number): Observable<StatisticCategory[]> {
    const params = new HttpParams()
      .set('playerId', playerId.toString())
      .set('eventId', eventId.toString());

    return this.http.get<Statistic[]>(`${this.baseUrl}/statistics`, { params })
      .pipe(
        map(statistics => this.groupStatisticsByCategory(statistics))
      );
  }

  // Get all statistics for an event
  getEventStatistics(eventId: number): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(`${this.baseUrl}/statistics/event/${eventId}`);
  }

  // Get statistics summary
  getStatisticsSummary(playerId?: number, eventId?: number): Observable<StatisticsSummary> {
    let params = new HttpParams();
    if (playerId) params = params.set('playerId', playerId.toString());
    if (eventId) params = params.set('eventId', eventId.toString());

    return this.http.get<StatisticsSummary>(`${this.baseUrl}/statistics/summary`, { params });
  }

  // Get all players statistics with filters
  getAllPlayersStats(
    teamId: number,
    gameType?: string,
    opponent?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50
  ): Observable<AllPlayersStatsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (gameType) params = params.set('gameType', gameType);
    if (opponent) params = params.set('opponent', opponent);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AllPlayersStatsResponse>(`${this.baseUrl}/statistics/team/${teamId}/all-players`, { params });
  }

  // Create or update statistic
  saveStatistic(statistic: Partial<Statistic>): Observable<Statistic> {
    if (statistic.id) {
      return this.http.put<Statistic>(`${this.baseUrl}/statistics/${statistic.id}`, statistic);
    } else {
      return this.http.post<Statistic>(`${this.baseUrl}/statistics`, statistic);
    }
  }

  // Delete statistic
  deleteStatistic(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/statistics/${id}`);
  }

  // Bulk create/update statistics
  bulkSaveStatistics(statistics: Partial<Statistic>[]): Observable<BulkStatisticsResponse> {
    return this.http.post<BulkStatisticsResponse>(`${this.baseUrl}/statistics/bulk`, { statistics });
  }

  // Get schedule events
  getScheduleEvents(teamId: number): Observable<ScheduleEvent[]> {
    return this.http.get<ScheduleEvent[]>(`${this.baseUrl}/schedule/team/${teamId}`);
  }

  // Get players for a team
  getTeamPlayers(teamId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.baseUrl}/players/team/${teamId}`);
  }

  // Helper method to group statistics by category for component use
  groupStatisticsByCategoryForDisplay(statistics: Statistic[]): { [category: string]: Statistic[] } {
    const grouped: { [category: string]: Statistic[] } = {};

    statistics.forEach(stat => {
      if (!grouped[stat.category]) {
        grouped[stat.category] = [];
      }
      grouped[stat.category].push(stat);
    });

    return grouped;
  }

  // Helper method to group statistics by category
  groupStatisticsByCategory(statistics: Statistic[]): StatisticCategory[] {
    const grouped: { [category: string]: Statistic[] } = {};

    statistics.forEach(stat => {
      if (!grouped[stat.category]) {
        grouped[stat.category] = [];
      }
      grouped[stat.category].push(stat);
    });

    return Object.keys(grouped).map(category => ({
      category,
      name: category,
      label: this.getCategoryDisplayName(category),
      stats: grouped[category]
    }));
  }

  // Helper method to get category display name
  private getCategoryDisplayName(categoryName: string): string {
    const categoryLabels: { [key: string]: string } = {
      'attacking': 'Attacking',
      'serving': 'Serving',
      'defending': 'Defending',
      'receiving': 'Receiving',
      'setting': 'Setting',
      'general': 'General'
    };
    return categoryLabels[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  }

  // Helper method to create grouped statistics object for display
  createGroupedStatistics(statistics: Statistic[]): GroupedStatistics {
    const grouped: GroupedStatistics = {};

    statistics.forEach(stat => {
      if (!grouped[stat.category]) {
        grouped[stat.category] = {};
      }
      if (!grouped[stat.category][stat.subcategory]) {
        grouped[stat.category][stat.subcategory] = {};
      }
      grouped[stat.category][stat.subcategory][stat.name] = stat.value;
    });

    return grouped;
  }

  // Helper method to download statistics as CSV
  downloadCSV(statistics: AllPlayersStatistic[], filename: string = 'volleyball_statistics.csv'): void {
    const headers = [
      'Player Name',
      'Jersey Number',
      'Position',
      'Event Date',
      'Event Type',
      'Opponent',
      'Category',
      'Subcategory',
      'Stat Name',
      'Value'
    ];

    const rows: string[][] = [headers];

    statistics.forEach(playerStat => {
      const playerName = `${playerStat.firstName} ${playerStat.lastName}`;
      
      Object.keys(playerStat.statistics).forEach(category => {
        Object.keys(playerStat.statistics[category]).forEach(subcategory => {
          Object.keys(playerStat.statistics[category][subcategory]).forEach(statName => {
            const value = playerStat.statistics[category][subcategory][statName];
            rows.push([
              playerName,
              playerStat.jerseyNumber.toString(),
              playerStat.position,
              playerStat.eventDate,
              playerStat.eventType,
              playerStat.opponent || 'N/A',
              category,
              subcategory,
              statName,
              value.toString()
            ]);
          });
        });
      });
    });

    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Update the statistics subject
  updateStatistics(statistics: StatisticCategory[]): void {
    this.statisticsSubject.next(statistics);
  }

  // Get current statistics value
  getCurrentStatistics(): StatisticCategory[] {
    return this.statisticsSubject.value;
  }

  // Calculate performance indicators
  calculatePerformanceIndicator(value: number, statName: string): 'excellent' | 'good' | 'average' | 'below-average' {
    // Define thresholds for different statistics
    const thresholds: { [key: string]: { excellent: number; good: number; average: number } } = {
      'Kills': { excellent: 15, good: 10, average: 5 },
      'Attacks': { excellent: 30, good: 20, average: 10 },
      'Attack Errors': { excellent: 2, good: 5, average: 8 }, // Lower is better
      'Aces': { excellent: 5, good: 3, average: 1 },
      'Service Errors': { excellent: 1, good: 3, average: 5 }, // Lower is better
      'Digs': { excellent: 20, good: 15, average: 8 },
      'Reception Errors': { excellent: 1, good: 3, average: 6 }, // Lower is better
      'Blocks': { excellent: 8, good: 5, average: 2 },
      'Block Errors': { excellent: 1, good: 2, average: 4 }, // Lower is better
      'Assists': { excellent: 25, good: 15, average: 8 }
    };

    const threshold = thresholds[statName];
    if (!threshold) {
      return 'average'; // Default for unknown stats
    }

    // For error stats, lower values are better
    const isErrorStat = statName.toLowerCase().includes('error');
    
    if (isErrorStat) {
      if (value <= threshold.excellent) return 'excellent';
      if (value <= threshold.good) return 'good';
      if (value <= threshold.average) return 'average';
      return 'below-average';
    } else {
      if (value >= threshold.excellent) return 'excellent';
      if (value >= threshold.good) return 'good';
      if (value >= threshold.average) return 'average';
      return 'below-average';
    }
  }

  // Format statistic value for display
  formatStatValue(value: number, statName: string): string {
    // Add percentage formatting for certain stats if needed
    if (statName.toLowerCase().includes('percentage') || statName.toLowerCase().includes('rate')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    // Regular number formatting
    return value.toString();
  }

  // Get unique values for filtering
  getUniqueGameTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/statistics/game-types`);
  }

  getUniqueOpponents(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/statistics/opponents`);
  }

  // Clear statistics cache
  clearStatistics(): void {
    this.statisticsSubject.next([]);
  }

  // Export statistics to CSV
  exportToCSV(filters: StatisticsFilters & { teamId: number }): Observable<Blob> {
    const params = new HttpParams({ fromObject: filters as any });
    return this.http.get(`${this.baseUrl}/statistics/export/csv`, {
      params,
      responseType: 'blob'
    });
  }

  // Export statistics to Excel
  exportToExcel(filters: StatisticsFilters & { teamId: number }): Observable<Blob> {
    const params = new HttpParams({ fromObject: filters as any });
    return this.http.get(`${this.baseUrl}/statistics/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // Get statistical analysis report
  getStatisticalAnalysis(teamId: number, filters?: StatisticsFilters): Observable<StatisticalAnalysis> {
    let params = new HttpParams().set('teamId', teamId.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<StatisticalAnalysis>(`${this.baseUrl}/statistics/analysis/${teamId}`, { params });
  }

  // Download file helper
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Statistical Analysis interfaces
export interface StatisticalAnalysis {
  summary: {
    total_records: number;
    categories_count: number;
    stats_count: number;
    players_count: number;
    earliest_date: string;
    latest_date: string;
  };
  trends: TrendAnalysis[];
  topPerformers: TopPerformer[];
  categoryAnalysis: CategoryAnalysis[];
  insights: Insight[];
}

export interface TrendAnalysis {
  stat_category: string;
  stat_name: string;
  recent_avg: number;
  previous_avg: number;
  recent_count: number;
  previous_count: number;
  trend_direction: 'improving' | 'declining';
  change_percentage: string;
}

export interface TopPerformer {
  first_name: string;
  last_name: string;
  jersey_number: number;
  stat_category: string;
  stat_name: string;
  best_value: number;
  avg_value: number;
  record_count: number;
}

export interface CategoryAnalysis {
  stat_category: string;
  record_count: number;
  average_value: number;
  max_value: number;
  min_value: number;
  std_deviation: number;
}

export interface Insight {
  type: 'category' | 'trend' | 'performance';
  message: string;
}
