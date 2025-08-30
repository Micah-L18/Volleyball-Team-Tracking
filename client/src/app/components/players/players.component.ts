import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';

import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';
import { Player, CreatePlayerRequest, VOLLEYBALL_POSITIONS, PLAYER_YEARS, DOMINANT_HANDS } from '../../interfaces/player.interface';
import { Team } from '../../models/types';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Players</h1>
            <p class="mt-2 text-sm text-gray-600">Manage your team players and their information</p>
          </div>
          <div class="mt-4 sm:mt-0">
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Player
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search by name or jersey number..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              [(ngModel)]="selectedTeamId"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Teams</option>
              <option *ngFor="let team of teams" [value]="team.id">{{team.name}}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              [(ngModel)]="selectedPosition"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              <option *ngFor="let position of positions" [value]="position.value">{{position.label}}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              [(ngModel)]="selectedYear"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              <option *ngFor="let year of years" [value]="year.value">{{year.label}}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Players Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" *ngIf="!loading && filteredPlayers.length > 0">
        <div *ngFor="let player of filteredPlayers" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <!-- Player Photo -->
          <div class="h-48 bg-gray-200 flex items-center justify-center">
            <img 
              *ngIf="player.photo_url" 
              [src]="player.photo_url" 
              [alt]="getPlayerDisplayName(player)"
              class="w-full h-full object-cover"
            >
            <div *ngIf="!player.photo_url" class="text-gray-400">
              <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          <!-- Player Info -->
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{getPlayerDisplayName(player)}}</h3>
              <span *ngIf="player.jersey_number" class="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                #{{player.jersey_number}}
              </span>
            </div>
            
            <div class="space-y-1 text-sm text-gray-600">
              <div *ngIf="player.position">
                <span class="font-medium">Position:</span> {{getPositionDisplay(player.position)}}
              </div>
              <div *ngIf="player.year">
                <span class="font-medium">Year:</span> {{getYearDisplay(player.year)}}
              </div>
              <div *ngIf="player.height">
                <span class="font-medium">Height:</span> {{formatHeight(player.height)}}
              </div>
              <div class="text-xs text-gray-500 mt-2">
                {{player.team_name}} • {{player.season}}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex space-x-2">
              <button
                (click)="viewPlayer(player)"
                class="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                View
              </button>
              <button
                (click)="editPlayer(player)"
                class="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Edit
              </button>
              <button
                (click)="deletePlayer(player)"
                class="bg-red-50 text-red-600 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredPlayers.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No players found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{players.length === 0 ? 'Get started by adding your first player.' : 'Try adjusting your search filters.'}}
        </p>
        <div class="mt-6" *ngIf="players.length === 0">
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Player
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>

    <!-- Create/Edit Player Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="closeModal()">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{isEditing ? 'Edit Player' : 'Add New Player'}}
            </h3>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Form -->
          <form [formGroup]="playerForm" (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Name (Required) -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Player Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  [class.border-red-500]="playerForm.get('name')?.invalid && playerForm.get('name')?.touched"
                >
                <div *ngIf="playerForm.get('name')?.invalid && playerForm.get('name')?.touched" class="mt-1 text-sm text-red-600">
                  Player name is required
                </div>
              </div>

              <!-- Team (Required) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Team <span class="text-red-500">*</span>
                </label>
                <select
                  formControlName="team_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  [class.border-red-500]="playerForm.get('team_id')?.invalid && playerForm.get('team_id')?.touched"
                >
                  <option value="">Select a team</option>
                  <option *ngFor="let team of teams" [value]="team.id">{{team.name}}</option>
                </select>
                <div *ngIf="playerForm.get('team_id')?.invalid && playerForm.get('team_id')?.touched" class="mt-1 text-sm text-red-600">
                  Please select a team
                </div>
              </div>

              <!-- Jersey Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                <input
                  type="number"
                  formControlName="jersey_number"
                  min="0"
                  max="99"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
              </div>

              <!-- Position -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  formControlName="position"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select position</option>
                  <option *ngFor="let position of positions" [value]="position.value">{{position.label}}</option>
                </select>
              </div>

              <!-- Year -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  formControlName="year"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select year</option>
                  <option *ngFor="let year of years" [value]="year.value">{{year.label}}</option>
                </select>
              </div>

              <!-- Height -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                <input
                  type="number"
                  formControlName="height"
                  min="48"
                  max="96"
                  step="0.5"
                  placeholder="Default: 70 inches (5'10&quot;)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">Leave blank to use default height of 70 inches</p>
              </div>

              <!-- Reach -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reach (inches)</label>
                <input
                  type="number"
                  formControlName="reach"
                  min="60"
                  max="140"
                  step="0.5"
                  placeholder="Default: 80 inches (6'8&quot;)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">Leave blank to use default reach of 80 inches</p>
              </div>

              <!-- Dominant Hand -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dominant Hand</label>
                <select
                  formControlName="dominant_hand"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select hand</option>
                  <option *ngFor="let hand of dominantHands" [value]="hand.value">{{hand.label}}</option>
                </select>
              </div>

              <!-- Contact Info -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
                <input
                  type="text"
                  formControlName="contact_info"
                  placeholder="Email, phone, parent contact, etc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
              </div>

              <!-- Photo URL -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                <input
                  type="url"
                  formControlName="photo_url"
                  placeholder="https://example.com/player-photo.jpg"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
              </div>

              <!-- Notes -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  formControlName="notes"
                  rows="3"
                  placeholder="Additional notes about the player..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="playerForm.invalid || submitting"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="submitting">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{isEditing ? 'Updating...' : 'Creating...'}}
                </span>
                <span *ngIf="!submitting">
                  {{isEditing ? 'Update Player' : 'Create Player'}}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class PlayersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  players: Player[] = [];
  teams: Team[] = [];
  filteredPlayers: Player[] = [];
  loading = true;
  
  // Filters
  searchTerm = '';
  selectedTeamId = '';
  selectedPosition = '';
  selectedYear = '';
  
  // Modal
  showModal = false;
  isEditing = false;
  editingPlayer: Player | null = null;
  playerForm: FormGroup;
  submitting = false;
  
  // Constants
  positions = VOLLEYBALL_POSITIONS;
  years = PLAYER_YEARS;
  dominantHands = DOMINANT_HANDS;

  constructor(
    private playerService: PlayerService,
    private teamService: TeamService,
    private fb: FormBuilder
  ) {
    this.playerForm = this.fb.group({
      name: ['', Validators.required],
      team_id: ['', Validators.required],
      position: [''],
      year: [''],
      jersey_number: [''],
      height: [''],
      reach: [''],
      dominant_hand: [''],
      contact_info: [''],
      photo_url: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;
    
    combineLatest([
      this.playerService.getPlayers(),
      this.teamService.getTeams()
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([players, teams]) => {
        this.players = players;
        this.teams = teams;
        this.filteredPlayers = players;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.players];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => 
        this.getPlayerDisplayName(player).toLowerCase().includes(term) ||
        (player.jersey_number && player.jersey_number.toString().includes(term))
      );
    }

    // Team filter
    if (this.selectedTeamId) {
      filtered = filtered.filter(player => player.team_id === parseInt(this.selectedTeamId));
    }

    // Position filter
    if (this.selectedPosition) {
      filtered = filtered.filter(player => player.position === this.selectedPosition);
    }

    // Year filter
    if (this.selectedYear) {
      filtered = filtered.filter(player => player.year === this.selectedYear);
    }

    this.filteredPlayers = filtered;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingPlayer = null;
    this.playerForm.reset();
    this.showModal = true;
  }

  editPlayer(player: Player): void {
    this.isEditing = true;
    this.editingPlayer = player;
    this.playerForm.patchValue(player);
    this.showModal = true;
  }

  viewPlayer(player: Player): void {
    // TODO: Navigate to player detail view
    console.log('View player:', player);
  }

  deletePlayer(player: Player): void {
    if (confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      this.playerService.deletePlayer(player.id).subscribe({
        next: () => {
          console.log('Player deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting player:', error);
          alert('Failed to delete player. Please try again.');
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingPlayer = null;
    this.playerForm.reset();
    this.submitting = false;
  }

  onSubmit(): void {
    if (this.playerForm.invalid) return;

    this.submitting = true;
    const formData = this.playerForm.value;
    
    // Convert string numbers to actual numbers
    if (formData.team_id) formData.team_id = parseInt(formData.team_id);
    if (formData.jersey_number) formData.jersey_number = parseInt(formData.jersey_number);
    if (formData.height) formData.height = parseFloat(formData.height);
    if (formData.reach) formData.reach = parseFloat(formData.reach);

    const request$ = this.isEditing && this.editingPlayer
      ? this.playerService.updatePlayer(this.editingPlayer.id, formData)
      : this.playerService.createPlayer(formData);

    request$.subscribe({
      next: (player) => {
        console.log(`Player ${this.isEditing ? 'updated' : 'created'} successfully:`, player);
        this.closeModal();
        this.loadData(); // Refresh the list
      },
      error: (error) => {
        console.error(`Error ${this.isEditing ? 'updating' : 'creating'} player:`, error);
        alert(`Failed to ${this.isEditing ? 'update' : 'create'} player. Please try again.`);
        this.submitting = false;
      }
    });
  }

  // Helper methods
  getPlayerDisplayName(player: Player): string {
    if (player.name) return player.name;
    return `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player';
  }

  getPositionDisplay(position: string): string {
    return this.playerService.getPositionDisplayName(position);
  }

  getYearDisplay(year: string): string {
    return this.playerService.getYearDisplayName(year);
  }

  formatHeight(height: number): string {
    return this.playerService.formatHeight(height);
  }
}
