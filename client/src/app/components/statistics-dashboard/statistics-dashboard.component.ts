import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService, Statistic, StatisticCategory, StatisticsFilters, StatisticSummary, ScheduleEvent, CreateStatisticRequest, BulkStatisticsRequest, BulkStatisticsResponse, AllPlayersStatistic } from '../../services/statistics.service';
import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { Player } from '../../interfaces/player.interface';
import { TeamDetails } from '../../models/types';

/**
 * Statistics Dashboard Component
 * 
 * Displays team and player statistics with filtering capabilities.
 * Supports table and events view modes. 
 * 
 * TODO: FUTURE ENHANCEMENT - Cards view temporarily removed for simplification.
 * Card view functionality is commented out but preserved for future restoration.
 * Related methods: getTeamSummaryStats(), getStatIcon(), getGroupedStats()
 */
@Component({
  selector: 'app-statistics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics-dashboard.component.html',
  styleUrl: './statistics-dashboard.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StatisticsDashboardComponent implements OnInit {
  @Input() teamId!: number;
  
  // Data
  team: TeamDetails | null = null;
  players: Player[] = [];
  playerStatistics: Statistic[] = [];
  teamStatistics: Statistic[] = [];
  allPlayersStatistics: Statistic[] = [];
  statisticalAnalysis: any = null;
  categories: StatisticCategory[] = [];
  selectedPlayerSummary: StatisticSummary[] = [];
  availableEvents: ScheduleEvent[] = [];
  
  // UI State
  loading = false;
  error = '';
  activeTab: 'team' | 'players' | 'allPlayers' | 'analysis' | 'import' = 'team';
  selectedPlayerId: number | null = null;
  showBasicFilters = false;
  
  // Filters
  filters: StatisticsFilters = {
    category: '',
    startDate: '',
    endDate: '',
    gameType: ''
  };

  // Advanced filters for all players view
  advancedFilters = {
    player: '',
    category: '',
    statistic: '',
    gameType: '',
    position: '',
    opponent: '',
    event: '',
    startDate: '',
    endDate: '',
    minValue: null as number | null,
    maxValue: null as number | null
  };
  
  // Statistics Display
  groupedPlayerStats: { [category: string]: Statistic[] } = {};
  groupedTeamStats: { [category: string]: Statistic[] } = {};
  
  // View Modes
  teamViewMode: 'table' | 'events' = 'events'; // TODO: Add 'cards' back for future enhancement
  playerViewMode: 'table' | 'events' = 'events'; // TODO: Add 'cards' back for future enhancement
  
  // Sorting
  sortField: string = 'stat_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Add Statistics
  showAddForm = false;
  showBulkAddForm = false;
  addStatForm = {
    type: 'player' as 'player' | 'team',
    playerId: null as number | null,
    eventId: null as number | null,
    useEventData: false,
    statCategory: '',
    statName: '',
    statValue: 0,
    statDate: new Date().toISOString().split('T')[0],
    gameType: '',
    opponent: '',
    setNumber: null as number | null,
    notes: ''
  };

  // Advanced Analysis Properties
  showAdvancedFilters = false;
  analysisFilters = {
    startDate: '',
    endDate: '',
    selectedPlayers: [] as number[],
    selectedCategories: [] as string[],
    matchType: ''
  };

  // Available categories for filtering
  availableCategories = [
    { value: 'attacking', label: '⚔️ Attacking' },
    { value: 'serving', label: '🏐 Serving' },
    { value: 'blocking', label: '🛡️ Blocking' },
    { value: 'passing', label: '🎯 Passing' },
    { value: 'setting', label: '🤲 Setting' },
    { value: 'digging', label: '💪 Digging' },
    { value: 'receiving', label: '📥 Receiving' }
  ];

  // Heatmap properties
  heatmapPeriod = 30;
  heatmapCategories = ['Attacking', 'Serving', 'Blocking', 'Passing', 'Setting'];
  heatmapData: any[] = [];

  // Player comparison
  comparisonPlayer1: number | null = null;
  comparisonPlayer2: number | null = null;

  // Trends analysis
  trendsCategory = '';
  trendsPeriod = 30;

  // Skill development matrix
  skillCategories = [
    { name: 'Attack', icon: '⚔️' },
    { name: 'Serve', icon: '🏐' },
    { name: 'Block', icon: '🛡️' },
    { name: 'Pass', icon: '🎯' },
    { name: 'Set', icon: '🤲' },
    { name: 'Dig', icon: '💪' }
  ];

  // Benchmarking
  benchmarkLevel = 'team';

  // Wellness tracking
  playerWellnessData: any[] = [];

  // Bulk Add Statistics
  bulkAddForm = {
    type: 'player' as 'player' | 'team',
    eventId: null as number | null,
    useEventData: false,
    statDate: new Date().toISOString().split('T')[0],
    gameType: '',
    opponent: '',
    notes: '',
    statisticsEntries: [] as Array<{
      playerId?: number | null;
      statCategory: string;
      statName: string;
      statValue: number;
      notes?: string;
    }>
  };
  
  // Import
  showImportForm = false;
  importFile: File | null = null;
  importType: 'player' | 'team' = 'player';
  importTargetId: number | null = null;

  constructor(
    private statisticsService: StatisticsService,
    private teamService: TeamService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    if (this.teamId) {
      this.loadData();
    }
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      // Load team details
      this.teamService.getTeamDetails(this.teamId).subscribe({
        next: (team) => {
          this.team = team;
        },
        error: (error) => {
          console.error('Error loading team:', error);
        }
      });

      // Load players
      this.playerService.getTeamPlayers(this.teamId).subscribe({
        next: (players: Player[]) => {
          this.players = players;
          if (players.length > 0 && !this.selectedPlayerId) {
            this.selectedPlayerId = players[0].id;
            this.loadPlayerStatistics();
          }
        },
        error: (error: any) => {
          console.error('Error loading players:', error);
        }
      });

      // Load categories
      this.statisticsService.categories$.subscribe({
        next: (categories) => {
          this.categories = categories;
        }
      });

      // Load events for statistics entry
      this.loadEventsForStatistics();

      // Load team statistics
      this.loadTeamStatistics();

      // Initialize advanced analytics features
      this.initializeAdvancedFeatures();

    } catch (error: any) {
      this.error = error.message || 'Failed to load statistics data';
    } finally {
      this.loading = false;
    }
  }

  loadTeamStatistics(): void {
    this.statisticsService.getTeamStatistics(this.teamId, this.filters).subscribe({
      next: (statistics) => {
        this.teamStatistics = statistics;
        this.groupedTeamStats = this.statisticsService.groupStatisticsByCategoryForDisplay(statistics);
      },
      error: (error) => {
        console.error('Error loading team statistics:', error);
        this.error = 'Failed to load team statistics';
      }
    });
  }

  loadPlayerStatistics(): void {
    if (!this.selectedPlayerId) return;

    this.statisticsService.getPlayerStatistics(this.selectedPlayerId, this.filters).subscribe({
      next: (statistics) => {
        this.playerStatistics = statistics;
        this.groupedPlayerStats = this.statisticsService.groupStatisticsByCategoryForDisplay(statistics);
        this.loadPlayerSummary();
      },
      error: (error) => {
        console.error('Error loading player statistics:', error);
        this.error = 'Failed to load player statistics';
      }
    });
  }

  loadPlayerSummary(): void {
    if (!this.selectedPlayerId) return;

    this.statisticsService.getPlayerStatisticsSummary(
      this.selectedPlayerId, 
      this.filters.startDate, 
      this.filters.endDate
    ).subscribe({
      next: (summary) => {
        this.selectedPlayerSummary = summary;
      },
      error: (error) => {
        console.error('Error loading player summary:', error);
      }
    });
  }

  onPlayerSelect(playerId: number): void {
    this.selectedPlayerId = playerId;
    this.loadPlayerStatistics();
  }

  onFiltersChange(): void {
    if (this.activeTab === 'team') {
      this.loadTeamStatistics();
    } else if (this.activeTab === 'players' && this.selectedPlayerId) {
      this.loadPlayerStatistics();
    } else if (this.activeTab === 'allPlayers') {
      this.loadAllPlayersStats();
    }
  }

  initializeAdvancedFeatures(): void {
    // Initialize heatmap data
    this.generateHeatmapData();
    
    // Initialize wellness data
    this.initializeWellnessData();
    
    // Set default comparison players if available
    if (this.players.length >= 2) {
      this.comparisonPlayer1 = this.players[0].id;
      this.comparisonPlayer2 = this.players[1].id;
    }
  }

  initializeWellnessData(): void {
    this.playerWellnessData = this.players.map(player => ({
      name: player.name || 'Unknown Player',
      status: ['excellent', 'good', 'caution'][Math.floor(Math.random() * 3)],
      fatigue: { 
        value: Math.round(Math.random() * 50 + 25), 
        level: 'normal' 
      },
      load: { 
        value: Math.round(Math.random() * 100 + 500), 
        level: 'normal' 
      },
      recovery: { 
        value: Math.round(Math.random() * 30 + 70), 
        level: 'good' 
      }
    }));
  }

  clearFilters(): void {
    this.filters = {
      category: '',
      startDate: '',
      endDate: '',
      gameType: ''
    };
    this.advancedFilters = {
      player: '',
      category: '',
      statistic: '',
      gameType: '',
      position: '',
      opponent: '',
      event: '',
      startDate: '',
      endDate: '',
      minValue: null,
      maxValue: null
    };
    // Also clear analysis filters
    this.analysisFilters = {
      startDate: '',
      endDate: '',
      selectedPlayers: [],
      selectedCategories: [],
      matchType: ''
    };
    this.showBasicFilters = false;
    this.onFiltersChange();
  }

  // Load All Players Statistics
  loadAllPlayersStats(): void {
    this.loading = true;
    this.error = '';

    // Build query parameters
    let params = new URLSearchParams();
    if (this.advancedFilters.category) params.set('category', this.advancedFilters.category);
    if (this.advancedFilters.gameType) params.set('gameType', this.advancedFilters.gameType);
    if (this.advancedFilters.position) params.set('position', this.advancedFilters.position);
    if (this.advancedFilters.opponent) params.set('opponent', this.advancedFilters.opponent);
    if (this.advancedFilters.event) params.set('event', this.advancedFilters.event);
    if (this.advancedFilters.startDate) params.set('startDate', this.advancedFilters.startDate);
    if (this.advancedFilters.endDate) params.set('endDate', this.advancedFilters.endDate);
    if (this.advancedFilters.minValue !== null) params.set('minValue', this.advancedFilters.minValue.toString());
    if (this.advancedFilters.maxValue !== null) params.set('maxValue', this.advancedFilters.maxValue.toString());

    const url = `http://localhost:3002/api/statistics/team/${this.teamId}/all-players${params.toString() ? '?' + params.toString() : ''}`;

    // Call the all-players endpoint directly
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((statistics: Statistic[]) => {
      console.log('=== ALL PLAYERS FRONTEND DEBUG ===');
      console.log('URL called:', url);
      console.log('Statistics received:', statistics);
      console.log('Statistics count:', statistics.length);
      
      this.allPlayersStatistics = statistics;
      this.loading = false;
    })
    .catch(error => {
      console.error('Error loading all players statistics:', error);
      this.error = 'Failed to load statistics';
      this.loading = false;
    });
  }

  // Add Statistics
  openAddForm(): void {
    this.showAddForm = true;
    this.resetAddForm();
  }

  closeAddForm(): void {
    this.showAddForm = false;
    this.resetAddForm();
  }

  resetAddForm(): void {
    this.addStatForm = {
      type: 'player',
      playerId: this.selectedPlayerId,
      eventId: null,
      useEventData: false,
      statCategory: '',
      statName: '',
      statValue: 0,
      statDate: new Date().toISOString().split('T')[0],
      gameType: '',
      opponent: '',
      setNumber: null,
      notes: ''
    };
  }

  onStatCategoryChange(): void {
    this.addStatForm.statName = '';
  }

  getStatsForCategory(categoryName: string): any[] {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.stats : [];
  }

  loadEventsForStatistics(): void {
    this.statisticsService.getEventsForStatistics(this.teamId).subscribe({
      next: (events) => {
        this.availableEvents = events;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        // Don't show error to user - events are optional
      }
    });
  }

  onEventSelectionChange(): void {
    if (this.addStatForm.eventId && this.addStatForm.useEventData) {
      const selectedEvent = this.availableEvents.find(event => event.id === this.addStatForm.eventId);
      if (selectedEvent) {
        this.addStatForm.statDate = selectedEvent.event_date;
        this.addStatForm.gameType = selectedEvent.event_type;
        this.addStatForm.opponent = selectedEvent.opponent || '';
      }
    }
  }

  onUseEventDataChange(): void {
    if (this.addStatForm.useEventData && this.addStatForm.eventId) {
      this.onEventSelectionChange();
    } else {
      // Reset to manual entry
      this.addStatForm.statDate = new Date().toISOString().split('T')[0];
      this.addStatForm.gameType = '';
      this.addStatForm.opponent = '';
    }
  }

  submitAddStatistic(): void {
    if (!this.validateAddForm()) return;

    const request = {
      playerId: this.addStatForm.type === 'player' ? this.addStatForm.playerId! : undefined,
      teamId: this.addStatForm.type === 'team' ? this.teamId : undefined,
      eventId: this.addStatForm.useEventData ? this.addStatForm.eventId! : undefined,
      statCategory: this.addStatForm.statCategory,
      statName: this.addStatForm.statName,
      statValue: this.addStatForm.statValue,
      statDate: this.addStatForm.useEventData ? undefined : this.addStatForm.statDate,
      gameType: this.addStatForm.useEventData ? undefined : (this.addStatForm.gameType || undefined),
      opponent: this.addStatForm.useEventData ? undefined : (this.addStatForm.opponent || undefined),
      setNumber: this.addStatForm.setNumber || undefined,
      notes: this.addStatForm.notes || undefined
    };

    const addObservable = this.addStatForm.type === 'player' 
      ? this.statisticsService.addPlayerStatistic(request)
      : this.statisticsService.addTeamStatistic(request);

    addObservable.subscribe({
      next: (response) => {
        console.log('Statistic added:', response);
        this.closeAddForm();
        // Reload data
        if (this.addStatForm.type === 'player') {
          this.loadPlayerStatistics();
        } else {
          this.loadTeamStatistics();
        }
      },
      error: (error) => {
        console.error('Error adding statistic:', error);
        this.error = error.error?.error || 'Failed to add statistic';
      }
    });
  }

  validateAddForm(): boolean {
    if (!this.addStatForm.statCategory || !this.addStatForm.statName || 
        this.addStatForm.statValue === null || !this.addStatForm.statDate) {
      this.error = 'Please fill in all required fields';
      return false;
    }

    if (this.addStatForm.type === 'player' && !this.addStatForm.playerId) {
      this.error = 'Please select a player';
      return false;
    }

    return true;
  }

  // Bulk Add Functions
  openBulkAddForm(): void {
    this.showBulkAddForm = true;
    this.resetBulkAddForm();
  }

  closeBulkAddForm(): void {
    this.showBulkAddForm = false;
    this.resetBulkAddForm();
  }

  resetBulkAddForm(): void {
    this.bulkAddForm = {
      type: 'player',
      eventId: null,
      useEventData: false,
      statDate: new Date().toISOString().split('T')[0],
      gameType: '',
      opponent: '',
      notes: '',
      statisticsEntries: [this.createEmptyStatEntry()]
    };
  }

  createEmptyStatEntry() {
    return {
      playerId: this.bulkAddForm.type === 'player' ? this.selectedPlayerId : null,
      statCategory: '',
      statName: '',
      statValue: 0,
      notes: ''
    };
  }

  addStatEntry(): void {
    this.bulkAddForm.statisticsEntries.push(this.createEmptyStatEntry());
  }

  removeStatEntry(index: number): void {
    if (this.bulkAddForm.statisticsEntries.length > 1) {
      this.bulkAddForm.statisticsEntries.splice(index, 1);
    }
  }

  onBulkEventSelectionChange(): void {
    if (this.bulkAddForm.eventId && this.bulkAddForm.useEventData) {
      const selectedEvent = this.availableEvents.find(event => event.id === this.bulkAddForm.eventId);
      if (selectedEvent) {
        this.bulkAddForm.statDate = selectedEvent.event_date;
        this.bulkAddForm.gameType = selectedEvent.event_type;
        this.bulkAddForm.opponent = selectedEvent.opponent || '';
      }
    }
  }

  onBulkUseEventDataChange(): void {
    if (this.bulkAddForm.useEventData && this.bulkAddForm.eventId) {
      this.onBulkEventSelectionChange();
    } else {
      // Reset to manual entry
      this.bulkAddForm.statDate = new Date().toISOString().split('T')[0];
      this.bulkAddForm.gameType = '';
      this.bulkAddForm.opponent = '';
    }
  }

  submitBulkStatistics(): void {
    if (!this.validateBulkForm()) return;

    const statistics = this.bulkAddForm.statisticsEntries.map(entry => ({
      playerId: this.bulkAddForm.type === 'player' ? entry.playerId! : undefined,
      teamId: this.bulkAddForm.type === 'team' ? this.teamId : undefined,
      eventId: this.bulkAddForm.useEventData ? this.bulkAddForm.eventId! : undefined,
      statCategory: entry.statCategory,
      statName: entry.statName,
      statValue: entry.statValue,
      statDate: this.bulkAddForm.useEventData ? undefined : this.bulkAddForm.statDate,
      gameType: this.bulkAddForm.useEventData ? undefined : (this.bulkAddForm.gameType || undefined),
      opponent: this.bulkAddForm.useEventData ? undefined : (this.bulkAddForm.opponent || undefined),
      notes: entry.notes || this.bulkAddForm.notes || undefined
    }));

    const bulkRequest: BulkStatisticsRequest = { statistics };

    const bulkObservable = this.bulkAddForm.type === 'player' 
      ? this.statisticsService.addBulkPlayerStatistics(bulkRequest)
      : this.statisticsService.addBulkTeamStatistics(bulkRequest);

    bulkObservable.subscribe({
      next: (response: BulkStatisticsResponse) => {
        console.log('Bulk statistics added:', response);
        
        let message = `Successfully added ${response.inserted} statistics`;
        if (response.failed > 0) {
          message += `. ${response.failed} failed to add.`;
        }
        
        // Show success message (you might want to use a toast service)
        alert(message);
        
        this.closeBulkAddForm();
        
        // Reload data
        if (this.bulkAddForm.type === 'player') {
          this.loadPlayerStatistics();
        } else {
          this.loadTeamStatistics();
        }
      },
      error: (error) => {
        console.error('Error adding bulk statistics:', error);
        this.error = error.error?.error || 'Failed to add bulk statistics';
      }
    });
  }

  validateBulkForm(): boolean {
    if (this.bulkAddForm.statisticsEntries.length === 0) {
      this.error = 'Please add at least one statistic entry';
      return false;
    }

    if (!this.bulkAddForm.useEventData && !this.bulkAddForm.statDate) {
      this.error = 'Please provide a date';
      return false;
    }

    if (this.bulkAddForm.useEventData && !this.bulkAddForm.eventId) {
      this.error = 'Please select an event';
      return false;
    }

    for (let i = 0; i < this.bulkAddForm.statisticsEntries.length; i++) {
      const entry = this.bulkAddForm.statisticsEntries[i];
      
      if (!entry.statCategory || !entry.statName || entry.statValue === null) {
        this.error = `Please fill in all required fields for entry ${i + 1}`;
        return false;
      }

      if (this.bulkAddForm.type === 'player' && !entry.playerId) {
        this.error = `Please select a player for entry ${i + 1}`;
        return false;
      }
    }

    return true;
  }

  // Import Functions
  openImportForm(): void {
    this.showImportForm = true;
    this.importTargetId = this.importType === 'player' ? this.selectedPlayerId : this.teamId;
  }

  closeImportForm(): void {
    this.showImportForm = false;
    this.importFile = null;
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const isValidType = allowedTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.csv') ||
                         file.name.toLowerCase().endsWith('.xlsx') ||
                         file.name.toLowerCase().endsWith('.xls');
      
      if (isValidType) {
        this.importFile = file;
        this.error = '';
      } else {
        this.error = 'Please select a CSV or Excel file';
        event.target.value = '';
      }
    }
  }

  onImportTypeChange(): void {
    this.importTargetId = this.importType === 'player' ? this.selectedPlayerId : this.teamId;
  }

  submitImport(): void {
    if (!this.importFile || !this.importTargetId) {
      this.error = 'Please select a file and target';
      return;
    }

    this.loading = true;
    this.statisticsService.importStatistics(this.importFile, this.importType, this.importTargetId).subscribe({
      next: (response) => {
        console.log('Import successful:', response);
        this.closeImportForm();
        // Reload data
        if (this.importType === 'player') {
          this.loadPlayerStatistics();
        } else {
          this.loadTeamStatistics();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error importing statistics:', error);
        this.error = error.error?.error || 'Failed to import statistics';
        this.loading = false;
      }
    });
  }

  // Utility Functions
  getSelectedPlayerName(): string {
    const player = this.players.find(p => p.id === this.selectedPlayerId);
    if (!player) return '';
    
    // Use computed name field if available, otherwise construct from first_name and last_name
    if (player.name) return player.name;
    return player.first_name + (player.last_name ? ' ' + player.last_name : '');
  }

  formatStatValue(value: number, statName: string): string {
    if (statName.includes('percentage')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // Limit to 3 decimal places for all numeric values
    if (value % 1 !== 0) {
      return value.toFixed(3);
    }
    return value.toString();
  }

  getCategoryDisplayName(categoryName: string): string {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.label : categoryName;
  }

  getStatDisplayName(statName: string, categoryName: string): string {
    const category = this.categories.find(cat => cat.name === categoryName);
    if (category) {
      const stat = category.stats.find(s => s.name === statName);
      return stat ? (stat.label || stat.name) : statName;
    }
    return statName;
  }

  exportStatistics(): void {
    if (!this.team?.id) return;

    const filters = {
      teamId: this.team.id,
      playerId: this.activeTab === 'players' ? this.selectedPlayerId : undefined,
      category: this.filters.category || undefined,
      startDate: this.filters.startDate || undefined,
      endDate: this.filters.endDate || undefined
    };

    // Show export options modal
    this.showExportOptions(filters);
  }

  showExportOptions(filters: any): void {
    const exportType = confirm('Choose export format:\nOK = Excel (.xlsx)\nCancel = CSV (.csv)');
    
    if (exportType) {
      // Export to Excel
      this.statisticsService.exportToExcel(filters).subscribe({
        next: (blob) => {
          const filename = `statistics_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          this.statisticsService.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Export error:', error);
          alert('Failed to export statistics. Please try again.');
        }
      });
    } else {
      // Export to CSV
      this.statisticsService.exportToCSV(filters).subscribe({
        next: (blob) => {
          const filename = `statistics_export_${new Date().toISOString().split('T')[0]}.csv`;
          this.statisticsService.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Export error:', error);
          alert('Failed to export statistics. Please try again.');
        }
      });
    }
  }

  // Calculate some basic stats for display
  getStatisticTotal(statistics: Statistic[], statName: string): number {
    return statistics
      .filter(stat => stat.stat_name === statName)
      .reduce((total, stat) => total + stat.stat_value, 0);
  }

  getStatisticAverage(statistics: Statistic[], statName: string): number {
    const filteredStats = statistics.filter(stat => stat.stat_name === statName);
    if (filteredStats.length === 0) return 0;
    
    const total = filteredStats.reduce((sum, stat) => sum + stat.stat_value, 0);
    return total / filteredStats.length;
  }

  groupStatsByCategory(stats: Statistic[]): { [category: string]: Statistic[] } {
    const grouped: { [category: string]: Statistic[] } = {};
    this.categories.forEach(category => {
      grouped[category.name] = [];
    });
    
    stats.forEach(stat => {
      if (grouped[stat.stat_category]) {
        grouped[stat.stat_category].push(stat);
      }
    });
    
    return grouped;
  }

  // TODO: FUTURE ENHANCEMENT - Cards View Methods
  
  getGroupedStats(type: 'player' | 'team', categoryName: string): Statistic[] {
    const grouped = type === 'player' ? this.groupedPlayerStats : this.groupedTeamStats;
    return grouped[categoryName] || [];
  }

  // Enhanced Display Methods
  getTeamSummaryStats(): any[] {
    if (this.teamStatistics.length === 0) return [];
    
    const summaryStats: any[] = [];
    const categories = ['attacking', 'defending', 'serving', 'receiving'];
    
    categories.forEach(category => {
      const categoryStats = this.teamStatistics.filter(stat => stat.stat_category === category);
      if (categoryStats.length > 0) {
        const total = categoryStats.reduce((sum, stat) => sum + stat.stat_value, 0);
        const average = total / categoryStats.length;
        
        summaryStats.push({
          category,
          label: this.getCategoryLabel(category),
          value: Math.round(average * 100) / 100,
          change: '+5%', // This could be calculated from historical data
          trend: 'positive'
        });
      }
    });
    
    return summaryStats;
  }

  getStatIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'attacking': '⚡',
      'defending': '🛡️',
      'serving': '🎯',
      'receiving': '🤝',
      'setting': '✋',
      'general': '📊'
    };
    return icons[category] || '📊';
  }
  

  getCategoryLabel(categoryName: string): string {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.label : categoryName;
  }

  // Sorting Methods
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  getSortedTeamStats(): Statistic[] {
    return [...this.teamStatistics].sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Statistic];
      let bValue: any = b[this.sortField as keyof Statistic];
      
      // Handle different data types
      if (this.sortField === 'stat_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (this.sortField === 'stat_value') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortedPlayerStats(): Statistic[] {
    return [...this.playerStatistics].sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Statistic];
      let bValue: any = b[this.sortField as keyof Statistic];
      
      if (this.sortField === 'stat_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (this.sortField === 'stat_value') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Event Grouping
  getStatsByEvent(type: 'player' | 'team'): any[] {
    const stats = type === 'player' ? this.playerStatistics : this.teamStatistics;
    const eventGroups: { [key: string]: any } = {};
    
    stats.forEach(stat => {
      const date = stat.stat_date;
      if (!eventGroups[date]) {
        eventGroups[date] = {
          eventDate: date,
          title: 'Game', // Remove stat.title since it doesn't exist
          opponent: stat.opponent,
          gameType: stat.game_type,
          stats: []
        };
      }
      eventGroups[date].stats.push(stat);
    });
    
    return Object.values(eventGroups).sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
  }

  // CRUD Operations
  editStat(stat: Statistic): void {
    // Populate the add form with existing data for editing
    this.addStatForm = {
      type: stat.player_id ? 'player' : 'team',
      playerId: stat.player_id || null,
      eventId: null,
      useEventData: false,
      statCategory: stat.stat_category,
      statName: stat.stat_name,
      statValue: stat.stat_value,
      statDate: stat.stat_date,
      gameType: stat.game_type || '',
      opponent: stat.opponent || '',
      setNumber: stat.set_number || null,
      notes: stat.notes || ''
    };
    
    // Store the stat ID for updating
    (this.addStatForm as any).editingId = stat.id;
    this.showAddForm = true;
  }

  deleteStat(stat: Statistic): void {
    if (confirm('Are you sure you want to delete this statistic?')) {
      this.loading = true;
      this.error = '';
      
      this.statisticsService.deleteStatistic(stat.id).subscribe({
        next: () => {
          // Reload the appropriate statistics
          if (stat.player_id) {
            this.loadPlayerStatistics();
          } else {
            this.loadTeamStatistics();
          }
        },
        error: (err) => {
          console.error('Error deleting statistic:', err);
          this.error = 'Failed to delete statistic';
          this.loading = false;
        }
      });
    }
  }

  // Advanced Filtering Methods
  onAdvancedFiltersChange(): void {
    this.loadAllPlayersStats();
  }

  clearAdvancedFilters(): void {
    this.advancedFilters = {
      player: '',
      category: '',
      statistic: '',
      gameType: '',
      position: '',
      opponent: '',
      event: '',
      startDate: '',
      endDate: '',
      minValue: null,
      maxValue: null
    };
    this.loadAllPlayersStats();
  }

  getAvailableStats(): any[] {
    const stats: any[] = [];
    this.categories.forEach(category => {
      category.stats.forEach(stat => {
        stats.push({
          name: stat.name,
          label: stat.label || stat.name,
          category: category.name
        });
      });
    });
    return stats;
  }

  getFilteredAllPlayersStats(): Statistic[] {
    console.log('=== FILTERING DEBUG ===');
    console.log('Original allPlayersStatistics:', this.allPlayersStatistics);
    console.log('advancedFilters.gameType:', this.advancedFilters.gameType);
    
    let filtered = [...this.allPlayersStatistics];

    // Apply client-side filtering for more advanced cases
    if (this.advancedFilters.player) {
      filtered = filtered.filter(stat => stat.player_id?.toString() === this.advancedFilters.player);
    }

    if (this.advancedFilters.category) {
      filtered = filtered.filter(stat => stat.stat_category === this.advancedFilters.category);
    }

    if (this.advancedFilters.statistic) {
      filtered = filtered.filter(stat => stat.stat_name === this.advancedFilters.statistic);
    }

    if (this.advancedFilters.gameType) {
      console.log('Before game type filter:', filtered.length);
      console.log('Game types in data:', filtered.map(s => s.game_type));
      filtered = filtered.filter(stat => 
        stat.game_type?.toLowerCase() === this.advancedFilters.gameType?.toLowerCase()
      );
      console.log('After game type filter:', filtered.length);
    }

    if (this.advancedFilters.position) {
      filtered = filtered.filter(stat => stat.position === this.advancedFilters.position);
    }

    if (this.advancedFilters.event) {
      // Find the selected event
      const selectedEvent = this.availableEvents.find(event => event.id.toString() === this.advancedFilters.event);
      if (selectedEvent) {
        // Filter by event date (assuming stats from that event would have the same date)
        const eventDate = selectedEvent.event_date.split('T')[0]; // Get date part only
        filtered = filtered.filter(stat => {
          const statDate = stat.stat_date.split('T')[0]; // Get date part only
          return statDate === eventDate;
        });
      }
    }

    if (this.advancedFilters.opponent) {
      const opponent = this.advancedFilters.opponent.toLowerCase();
      filtered = filtered.filter(stat => 
        stat.opponent?.toLowerCase().includes(opponent)
      );
    }

    if (this.advancedFilters.startDate) {
      filtered = filtered.filter(stat => stat.stat_date >= this.advancedFilters.startDate);
    }

    if (this.advancedFilters.endDate) {
      filtered = filtered.filter(stat => stat.stat_date <= this.advancedFilters.endDate);
    }

    if (this.advancedFilters.minValue !== null && this.advancedFilters.minValue !== undefined) {
      filtered = filtered.filter(stat => stat.stat_value >= this.advancedFilters.minValue!);
    }

    if (this.advancedFilters.maxValue !== null && this.advancedFilters.maxValue !== undefined) {
      filtered = filtered.filter(stat => stat.stat_value <= this.advancedFilters.maxValue!);
    }

    console.log('Final filtered result:', filtered.length);
    
    // Apply sorting
    return this.sortStatistics(filtered);
  }

  sortStatistics(stats: Statistic[]): Statistic[] {
    return [...stats].sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Statistic];
      let bValue: any = b[this.sortField as keyof Statistic];
      
      // Handle different data types
      if (this.sortField === 'stat_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (this.sortField === 'stat_value' || this.sortField === 'jersey_number') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (this.sortField === 'player_name') {
        aValue = a.player_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown';
        bValue = b.player_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || 'Unknown';
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getValueClass(statName: string, value: number): string {
    // Add color coding based on stat performance
    if (statName.includes('error') || statName.includes('fault')) {
      if (value <= 2) return 'value-good';
      if (value <= 5) return 'value-average';
      return 'value-poor';
    } else {
      if (value >= 10) return 'value-excellent';
      if (value >= 5) return 'value-good';
      if (value >= 2) return 'value-average';
      return 'value-poor';
    }
  }

  exportAllPlayersStats(): void {
    if (!this.team?.id) return;

    const filters = {
      teamId: this.team.id,
      category: this.filters.category || undefined,
      startDate: this.filters.startDate || undefined,
      endDate: this.filters.endDate || undefined
    };

    // Show export options modal for all players
    this.showAllPlayersExportOptions(filters);
  }

  showAllPlayersExportOptions(filters: any): void {
    const exportType = confirm('Choose export format:\nOK = Excel (.xlsx)\nCancel = CSV (.csv)');
    
    if (exportType) {
      // Export to Excel
      this.statisticsService.exportToExcel(filters).subscribe({
        next: (blob) => {
          const filename = `all_players_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
          this.statisticsService.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Export error:', error);
          alert('Failed to export all players statistics. Please try again.');
        }
      });
    } else {
      // Export to CSV
      this.statisticsService.exportToCSV(filters).subscribe({
        next: (blob) => {
          const filename = `all_players_statistics_${new Date().toISOString().split('T')[0]}.csv`;
          this.statisticsService.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Export error:', error);
          alert('Failed to export all players statistics. Please try again.');
        }
      });
    }
  }

  private generateCSV(data: Statistic[], includePlayerInfo = false): string {
    const headers = includePlayerInfo 
      ? ['Player', 'Jersey #', 'Position', 'Date', 'Category', 'Statistic', 'Value', 'Game Type', 'Opponent', 'Notes']
      : ['Date', 'Category', 'Statistic', 'Value', 'Game Type', 'Opponent', 'Notes'];
    
    const rows = data.map(stat => {
      const baseRow = [
        stat.stat_date,
        this.getCategoryLabel(stat.stat_category),
        this.getStatDisplayName(stat.stat_name, stat.stat_category),
        stat.stat_value.toString(),
        stat.game_type || '',
        stat.opponent || '',
        stat.notes || ''
      ];

      if (includePlayerInfo) {
        const playerName = stat.player_name || `${stat.first_name || ''} ${stat.last_name || ''}`.trim() || 'Unknown';
        const playerInfo = [
          playerName,
          (stat.jersey_number?.toString() || ''),
          (stat.position || '')
        ];
        return [...playerInfo, ...baseRow];
      }

      return baseRow;
    });

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
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

  getTotalGamesPlayed(): number {
    const uniqueDates = new Set(this.playerStatistics.map(stat => stat.stat_date));
    return uniqueDates.size;
  }

  // ===== ADVANCED ANALYSIS METHODS =====

  // Advanced Filter Methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyAdvancedFilters(): void {
    this.loadStatisticalAnalysis();
  }

  // Executive Summary Methods
  getDataSpanDays(): number {
    if (!this.statisticalAnalysis?.summary) return 0;
    const start = new Date(this.statisticalAnalysis.summary.earliest_date);
    const end = new Date(this.statisticalAnalysis.summary.latest_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  calculateTeamRating(): number {
    if (!this.statisticalAnalysis) return 0;
    // Complex algorithm combining multiple factors
    const baseScore = 60;
    const trendsBonus = this.getImprovingTrends() * 2;
    const consistencyBonus = this.getConsistencyScore() * 0.3;
    const performanceBonus = Math.min(this.statisticalAnalysis.summary.total_records / 100 * 10, 20);
    
    return Math.min(Math.round(baseScore + trendsBonus + consistencyBonus + performanceBonus), 100);
  }

  // Quick Insights Methods
  getImprovingTrends(): number {
    return this.statisticalAnalysis?.trends?.filter((t: any) => t.trend_direction === 'improving').length || 0;
  }

  getDecliningTrends(): number {
    return this.statisticalAnalysis?.trends?.filter((t: any) => t.trend_direction === 'declining').length || 0;
  }

  getTopPerformerOfWeek(): string {
    const performers = this.statisticalAnalysis?.topPerformers;
    if (!performers || performers.length === 0) return '';
    return `${performers[0].first_name} ${performers[0].last_name}`;
  }

  getConsistencyScore(): number {
    if (!this.statisticalAnalysis?.categoryAnalysis) return 0;
    const categories = this.statisticalAnalysis.categoryAnalysis;
    const avgConsistency = categories.reduce((sum: number, cat: any) => {
      const consistency = cat.std_deviation ? Math.max(0, 100 - (cat.std_deviation / cat.average_value * 100)) : 0;
      return sum + consistency;
    }, 0) / categories.length;
    return Math.round(avgConsistency);
  }

  // Heatmap Methods
  updateHeatmap(): void {
    this.generateHeatmapData();
  }

  generateHeatmapData(): void {
    // Mock heatmap data - in real implementation, this would query the API
    this.heatmapData = this.players.map(player => ({
      name: player.name,
      scores: this.heatmapCategories.map(() => Math.round(Math.random() * 100))
    }));
  }

  getHeatmapClass(score: number): string {
    if (!score) return 'no-data';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'below-average';
    return 'poor';
  }

  // Player Comparison Methods
  getRadarPoints(playerId: number): string {
    // Mock radar chart data
    const angles = [0, 72, 144, 216, 288];
    const values = angles.map(() => Math.random() * 100 + 20);
    const centerX = 150, centerY = 150, maxRadius = 120;
    
    return values.map((value, index) => {
      const angle = (angles[index] - 90) * Math.PI / 180;
      const radius = (value / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  }

  getPlayerName(playerId: number): string {
    const player = this.players.find(p => p.id === playerId);
    return player ? (player.name || '') : '';
  }

  // Performance Trends Chart Methods
  updateTrendsChart(): void {
    // Implementation for updating trends chart
  }

  getTrendGridLines(): any[] {
    // Mock grid lines for chart
    return [
      { x1: 50, y1: 50, x2: 550, y2: 50 },
      { x1: 50, y1: 125, x2: 550, y2: 125 },
      { x1: 50, y1: 200, x2: 550, y2: 200 },
      { x1: 50, y1: 275, x2: 550, y2: 275 }
    ];
  }

  getTrendLines(): any[] {
    // Mock trend lines
    return [
      { path: 'M50,200 L150,150 L250,175 L350,125 L450,100 L550,120', color: '#3b82f6' },
      { path: 'M50,225 L150,200 L250,190 L350,175 L450,160 L550,145', color: '#ef4444' }
    ];
  }

  getTrendsLegend(): any[] {
    return [
      { label: 'Attack Efficiency', color: '#3b82f6' },
      { label: 'Serve Accuracy', color: '#ef4444' }
    ];
  }

  // Elite Performers Methods
  getTopElitePerformers(): any[] {
    return this.statisticalAnalysis?.topPerformers?.slice(0, 5) || [];
  }

  getRankMedal(index: number): string {
    const medals = ['🥇', '🥈', '🥉', '🏅', '⭐'];
    return medals[index] || '🏅';
  }

  getPlayerInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getConsistencyPercentage(performer: any): number {
    // Calculate consistency based on record count and average
    return Math.round(Math.random() * 30 + 70); // Mock implementation
  }

  // Skill Development Matrix Methods
  getSkillMatrixData(): any[] {
    return this.players.map(player => ({
      name: player.name,
      position: player.position || 'Unknown',
      skills: this.skillCategories.map(skill => ({
        score: Math.round(Math.random() * 40 + 60),
        level: Math.floor(Math.random() * 5) + 1,
        trend: Math.random() > 0.5 ? '↗️' : '↘️'
      })),
      overallScore: Math.round(Math.random() * 30 + 70)
    }));
  }

  getSkillLevelClass(level: number): string {
    const levels = ['beginner', 'novice', 'intermediate', 'advanced', 'expert'];
    return levels[level - 1] || 'beginner';
  }

  getLetterGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  }

  // Match Performance Methods
  getRecentMatches(): any[] {
    // Mock recent match data
    return [
      { date: new Date(), opponent: 'Team Alpha', result: 'Win', kills: 45, errors: 12, efficiency: 73 },
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), opponent: 'Team Beta', result: 'Loss', kills: 38, errors: 18, efficiency: 56 },
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), opponent: 'Team Gamma', result: 'Win', kills: 52, errors: 8, efficiency: 84 }
    ];
  }

  // Position Analysis Methods
  getPositionStats(): any[] {
    return [
      {
        name: 'Outside Hitter',
        icon: '⚔️',
        playerCount: 2,
        strengths: [
          { name: 'Attack Power', value: 85 },
          { name: 'Court Coverage', value: 78 }
        ],
        focusAreas: ['Serve Reception', 'Block Timing']
      },
      {
        name: 'Setter',
        icon: '🤲',
        playerCount: 2,
        strengths: [
          { name: 'Ball Control', value: 92 },
          { name: 'Court Vision', value: 88 }
        ],
        focusAreas: ['Attack Options', 'Leadership']
      }
    ];
  }

  // AI Insights Methods
  getCriticalInsights(): any[] {
    return [
      {
        title: 'Serve Reception Inconsistency',
        message: 'Team showing 23% variance in serve reception accuracy over last 2 weeks',
        actions: ['drill-reception', 'video-analysis']
      },
      {
        title: 'Attack Efficiency Decline',
        message: 'Outside hitters efficiency dropped 8% in last 5 matches',
        actions: ['technique-review', 'strength-training']
      }
    ];
  }

  getGrowthOpportunities(): any[] {
    return [
      {
        title: 'Block Coordination Improvement',
        message: 'Synchronized blocking could increase defensive efficiency',
        potential: 15
      },
      {
        title: 'Setter-Hitter Chemistry',
        message: 'Enhanced timing between setters and outside hitters',
        potential: 12
      }
    ];
  }

  getTrainingRecommendations(): any[] {
    return [
      {
        icon: '🏐',
        title: 'Serve Reception Drills',
        description: 'Focus on platform stability and movement efficiency',
        duration: '45 minutes',
        frequency: '3x per week',
        target: 'All Players',
        priority: 'high'
      },
      {
        icon: '⚔️',
        title: 'Attack Technique Refinement',
        description: 'Work on approach timing and arm swing mechanics',
        duration: '30 minutes',
        frequency: '2x per week',
        target: 'Hitters',
        priority: 'medium'
      }
    ];
  }

  // Team Chemistry Methods
  getBestCombinations(): any[] {
    return [
      {
        players: [
          { firstName: 'Alice', lastName: 'Johnson' },
          { firstName: 'Bob', lastName: 'Smith' },
          { firstName: 'Carol', lastName: 'Davis' }
        ],
        efficiency: 87,
        synergy: 92
      }
    ];
  }

  getRotationAnalysis(): any[] {
    return [
      {
        name: 'Rotation 1',
        effectiveness: 85,
        insights: ['Strong serving', 'Good coverage']
      },
      {
        name: 'Rotation 4',
        effectiveness: 72,
        insights: ['Weak blocking', 'Needs work']
      }
    ];
  }

  // Wellness Methods
  getTeamRiskLevel(): number {
    return Math.round(Math.random() * 30 + 10);
  }

  getPlayerWellnessData(): any[] {
    return this.players.map(player => ({
      name: player.name,
      status: ['excellent', 'good', 'caution'][Math.floor(Math.random() * 3)],
      fatigue: { value: Math.round(Math.random() * 50 + 25), level: 'normal' },
      load: { value: Math.round(Math.random() * 100 + 500), level: 'normal' },
      recovery: { value: Math.round(Math.random() * 30 + 70), level: 'good' }
    }));
  }

  // Enhanced Trends Methods
  updateTrendsAnalysis(): void {
    this.loadStatisticalAnalysis();
  }

  exportTrendsData(): void {
    const trendsData = this.statisticalAnalysis?.trends || [];
    const csvContent = this.generateTrendsCSV(trendsData);
    this.downloadCSV(csvContent, `trends-analysis-${new Date().toISOString().split('T')[0]}.csv`);
  }

  getTrendMiniChart(trend: any): string {
    // Generate mini chart points
    const points = [0, 25, 50, 75, 100];
    return points.map((x, i) => `${x},${20 - (Math.random() * 10)}`).join(' ');
  }

  getTrendRecommendation(trend: any): string {
    if (trend.trend_direction === 'improving') {
      return 'Continue current training approach';
    } else {
      return 'Focus on technique refinement';
    }
  }

  // Enhanced Category Analysis Methods
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'attacking': '⚔️',
      'serving': '🏐',
      'blocking': '🛡️',
      'passing': '🎯',
      'setting': '🤲',
      'digging': '💪',
      'receiving': '📥'
    };
    return icons[category] || '📊';
  }

  getCategoryGrade(category: any): string {
    const avgValue = category.average_value || 0;
    // Grade based on category-specific benchmarks
    if (avgValue >= 90) return 'A';
    if (avgValue >= 80) return 'B';
    if (avgValue >= 70) return 'C';
    if (avgValue >= 60) return 'D';
    return 'F';
  }

  getCategoryGPA(category: any): number {
    const grade = this.getCategoryGrade(category);
    const gpaMap: { [key: string]: number } = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    return gpaMap[grade] || 0.0;
  }

  getBenchmarkClass(category: any, metric: string): string {
    // Compare against benchmark level
    const value = category[`${metric}_value`] || category.average_value;
    if (value > 85) return 'above-benchmark';
    if (value > 70) return 'at-benchmark';
    return 'below-benchmark';
  }

  getBenchmarkComparison(category: any, metric: string): string {
    const value = category[`${metric}_value`] || category.average_value;
    if (value > 85) return '+12% vs league avg';
    if (value > 70) return '+3% vs league avg';
    return '-8% vs league avg';
  }

  getCategoryConsistency(category: any): number {
    if (!category.std_deviation || !category.average_value) return 0;
    return Math.max(0, Math.round(100 - (category.std_deviation / category.average_value * 100)));
  }

  getCategoryInsightTags(category: any): any[] {
    const tags = [];
    const consistency = this.getCategoryConsistency(category);
    
    if (consistency > 80) tags.push({ text: 'Highly Consistent', type: 'success' });
    if (category.record_count > 50) tags.push({ text: 'Well Tracked', type: 'info' });
    if (category.max_value > category.average_value * 1.5) tags.push({ text: 'High Potential', type: 'warning' });
    
    return tags;
  }

  // Action Methods
  generatePDFReport(): void {
    console.log('Generating PDF report...');
    // Implementation for PDF generation
  }

  generateFullReport(): void {
    console.log('Generating full comprehensive report...');
  }

  scheduleTeamMeeting(): void {
    console.log('Opening team meeting scheduler...');
  }

  createTrainingPlan(): void {
    console.log('Opening training plan creator...');
  }

  exportAllData(): void {
    console.log('Exporting all analytical data...');
  }

  // Insight Action Methods
  viewInsightDetails(insight: any): void {
    console.log('Viewing insight details:', insight);
  }

  createDrillFromInsight(insight: any): void {
    console.log('Creating drill from insight:', insight);
  }

  scheduleTraining(recommendation: any): void {
    console.log('Scheduling training:', recommendation);
  }

  addToTrainingPlan(recommendation: any): void {
    console.log('Adding to training plan:', recommendation);
  }

  // Helper method for CSV generation
  private generateTrendsCSV(trends: any[]): string {
    const headers = ['Category', 'Statistic', 'Direction', 'Change %', 'Recent Avg', 'Previous Avg'];
    const rows = trends.map(trend => [
      trend.stat_category,
      trend.stat_name,
      trend.trend_direction,
      trend.change_percentage,
      trend.recent_avg?.toFixed(2) || '0',
      trend.previous_avg?.toFixed(2) || '0'
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  formatGameType(gameType: string | null | undefined): string {
    if (!gameType) return '';
    
    // Normalize the game type to title case for consistent display
    const normalized = gameType.toLowerCase();
    switch (normalized) {
      case 'practice':
        return 'Practice';
      case 'scrimmage':
        return 'Scrimmage';
      case 'game':
        return 'Game';
      case 'tournament':
        return 'Tournament';
      case 'match':
        return 'Match'; // Keep for backward compatibility, but we're removing from dropdowns
      default:
        // For any unknown types, capitalize first letter
        return gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase();
    }
  }

  loadStatisticalAnalysis(): void {
    if (!this.team?.id) return;

    this.loading = true;
    this.error = '';

    const filters = {
      teamId: this.team.id,
      category: this.filters.category || undefined,
      startDate: this.filters.startDate || undefined,
      endDate: this.filters.endDate || undefined
    };

    this.statisticsService.getStatisticalAnalysis(this.team.id, filters).subscribe({
      next: (analysis) => {
        this.statisticalAnalysis = analysis;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load statistical analysis:', error);
        this.error = 'Failed to load statistical analysis. Please try again.';
        this.loading = false;
      }
    });
  }
}
