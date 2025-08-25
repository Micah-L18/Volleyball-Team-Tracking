import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { TeamDetails, TeamMember } from '../../models/types';
import { Player, CreatePlayerRequest, VOLLEYBALL_POSITIONS, PLAYER_YEARS, DOMINANT_HANDS } from '../../interfaces/player.interface';
import { SkillRatingComponent } from '../skill-rating/skill-rating.component';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';
import { ScheduleComponent } from '../schedule/schedule.component';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SkillRatingComponent, AnalyticsDashboardComponent, ScheduleComponent],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  team: TeamDetails | null = null;
  players: Player[] = [];
  loading = true;
  playersLoading = false;
  error = '';
  
  // Tab management
  activeTab: 'info' | 'members' | 'players' | 'skills' | 'analytics' | 'schedule' = 'info';
  selectedPlayerForRating: Player | null = null;
  
  // Team management
  showInviteForm = false;
  showEditForm = false;

  // Player management
  showPlayerModal = false;
  isEditingPlayer = false;
  editingPlayer: Player | null = null;
  playerForm: FormGroup;
  submittingPlayer = false;

  inviteData = {
    email: '',
    role: 'player'
  };

  editData = {
    name: '',
    description: '',
    season: '',
    age_group: ''
  };

  roles = [
    { value: 'assistant_coach', label: 'Assistant Coach' },
    { value: 'player', label: 'Player' },
    { value: 'parent', label: 'Parent' }
  ];

  // Player constants
  positions = VOLLEYBALL_POSITIONS;
  years = PLAYER_YEARS;
  dominantHands = DOMINANT_HANDS;

  constructor(
    private teamService: TeamService,
    private playerService: PlayerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.playerForm = this.fb.group({
      name: ['', Validators.required],
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
    // Check authentication status
    console.log('Auth status on team detail load:', {
      isLoggedIn: this.authService.isLoggedIn(),
      hasToken: !!this.authService.getToken(),
      token: this.authService.getToken()
    });

    // If not logged in, redirect to login
    if (!this.authService.isLoggedIn()) {
      console.log('User not logged in, redirecting to login page');
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      const teamId = Number(params['id']);
      if (teamId) {
        this.loadTeamDetails(teamId);
        this.loadTeamPlayers(teamId);
      }
    });
  }

  loadTeamDetails(teamId: number): void {
    this.loading = true;
    this.error = '';

    this.teamService.getTeamDetails(teamId).subscribe({
      next: (team) => {
        this.team = team;
        this.editData = {
          name: team.name,
          description: team.description || '',
          season: team.season || '',
          age_group: team.age_group || ''
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading team:', error);
        this.error = 'Failed to load team details';
        this.loading = false;
      }
    });
  }

  loadTeamPlayers(teamId: number): void {
    this.playersLoading = true;
    this.playerService.getTeamPlayers(teamId).subscribe({
      next: (players) => {
        this.players = players;
        this.playersLoading = false;
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.playersLoading = false;
      }
    });
  }

  // Tab management
  setActiveTab(tab: 'info' | 'members' | 'players' | 'skills' | 'analytics' | 'schedule'): void {
    this.activeTab = tab;
  }

  // Role checking
  isCoach(): boolean {
    return this.team?.userRole === 'head_coach' || this.team?.userRole === 'assistant_coach';
  }

  // Player management methods
  openCreatePlayerModal(): void {
    this.isEditingPlayer = false;
    this.editingPlayer = null;
    this.playerForm.reset();
    this.showPlayerModal = true;
  }

  editPlayer(player: Player): void {
    this.isEditingPlayer = true;
    this.editingPlayer = player;
    this.playerForm.patchValue(player);
    this.showPlayerModal = true;
  }

  deletePlayer(player: Player): void {
    if (confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      this.playerService.deletePlayer(player.id).subscribe({
        next: () => {
          console.log('Player deleted successfully');
          if (this.team) {
            this.loadTeamPlayers(this.team.id!);
          }
        },
        error: (error) => {
          console.error('Error deleting player:', error);
          alert('Failed to delete player. Please try again.');
        }
      });
    }
  }

  closePlayerModal(): void {
    this.showPlayerModal = false;
    this.isEditingPlayer = false;
    this.editingPlayer = null;
    this.playerForm.reset();
    this.submittingPlayer = false;
  }

  onSubmitPlayer(): void {
    // Check if user is logged in first
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to add players. Redirecting to login...');
      this.router.navigate(['/login']);
      return;
    }

    if (this.playerForm.invalid || !this.team) {
      console.log('Form invalid or no team:', {
        formInvalid: this.playerForm.invalid,
        formErrors: this.playerForm.errors,
        formValue: this.playerForm.value,
        team: this.team
      });
      return;
    }

    this.submittingPlayer = true;
    const formData = { ...this.playerForm.value, team_id: this.team.id };
    
    // Convert string numbers to actual numbers
    if (formData.jersey_number) formData.jersey_number = parseInt(formData.jersey_number);
    if (formData.height) formData.height = parseFloat(formData.height);
    if (formData.reach) formData.reach = parseFloat(formData.reach);

    console.log('Submitting player data:', formData);
    console.log('Current auth status:', {
      isLoggedIn: this.authService.isLoggedIn(),
      hasToken: !!this.authService.getToken()
    });

    const request$ = this.isEditingPlayer && this.editingPlayer
      ? this.playerService.updatePlayer(this.editingPlayer.id, formData)
      : this.playerService.createPlayer(formData);

    request$.subscribe({
      next: (player) => {
        console.log(`Player ${this.isEditingPlayer ? 'updated' : 'created'} successfully:`, player);
        this.closePlayerModal();
        this.loadTeamPlayers(this.team!.id!);
      },
      error: (error) => {
        console.error(`Error ${this.isEditingPlayer ? 'updating' : 'creating'} player:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        // Check if it's an auth error
        if (error.status === 401) {
          alert('Your session has expired. Please log in again.');
          this.authService.logout();
          return;
        }
        
        alert(`Failed to ${this.isEditingPlayer ? 'update' : 'create'} player. Please try again. Error: ${error.error?.error || error.message}`);
        this.submittingPlayer = false;
      }
    });
  }

  // Helper methods for players
  getPositionDisplay(position: string): string {
    return this.playerService.getPositionDisplayName(position);
  }

  getYearDisplay(year: string): string {
    return this.playerService.getYearDisplayName(year);
  }

  formatHeight(height: number): string {
    return this.playerService.formatHeight(height);
  }

  inviteUser(): void {
    if (!this.team || !this.inviteData.email.trim()) {
      this.error = 'Email is required';
      return;
    }

    this.teamService.inviteUser(this.team.id!, this.inviteData.email, this.inviteData.role).subscribe({
      next: (response) => {
        console.log('User invited successfully:', response);
        this.resetInviteForm();
        this.loadTeamDetails(this.team!.id!); // Refresh team details
      },
      error: (error) => {
        console.error('Error inviting user:', error);
        this.error = error.error?.error || 'Failed to invite user. Please try again.';
      }
    });
  }

  updateTeam(): void {
    if (!this.team || !this.editData.name.trim()) {
      this.error = 'Team name is required';
      return;
    }

    this.teamService.updateTeam(this.team.id!, this.editData).subscribe({
      next: (response) => {
        console.log('Team updated successfully:', response);
        this.showEditForm = false;
        this.loadTeamDetails(this.team!.id!); // Refresh team details
      },
      error: (error) => {
        console.error('Error updating team:', error);
        this.error = error.error?.error || 'Failed to update team. Please try again.';
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!this.team || !confirm(`Are you sure you want to remove ${member.first_name} ${member.last_name} from the team?`)) {
      return;
    }

    this.teamService.removeMember(this.team.id!, member.id).subscribe({
      next: (response) => {
        console.log('Member removed successfully:', response);
        this.loadTeamDetails(this.team!.id!); // Refresh team details
      },
      error: (error) => {
        console.error('Error removing member:', error);
        this.error = error.error?.error || 'Failed to remove member. Please try again.';
      }
    });
  }

  updateMemberRole(member: TeamMember, newRole: string): void {
    if (!this.team || newRole === member.role) {
      return;
    }

    this.teamService.updateMemberRole(this.team.id!, member.id, newRole).subscribe({
      next: (response) => {
        console.log('Member role updated successfully:', response);
        this.loadTeamDetails(this.team!.id!); // Refresh team details
      },
      error: (error) => {
        console.error('Error updating member role:', error);
        this.error = error.error?.error || 'Failed to update member role. Please try again.';
      }
    });
  }

  resetInviteForm(): void {
    this.inviteData = {
      email: '',
      role: 'player'
    };
    this.showInviteForm = false;
    this.error = '';
  }

  resetEditForm(): void {
    if (this.team) {
      this.editData = {
        name: this.team.name,
        description: this.team.description || '',
        season: this.team.season || '',
        age_group: this.team.age_group || ''
      };
    }
    this.showEditForm = false;
    this.error = '';
  }

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    if (!this.showInviteForm) {
      this.resetInviteForm();
    }
  }

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    if (!this.showEditForm) {
      this.resetEditForm();
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'head_coach': return 'Head Coach';
      case 'assistant_coach': return 'Assistant Coach';
      case 'player': return 'Player';
      case 'parent': return 'Parent';
      default: return role;
    }
  }

  canInviteMembers(): boolean {
    return this.team?.userRole === 'head_coach' || this.team?.userRole === 'assistant_coach';
  }

  canEditTeam(): boolean {
    return this.team?.userRole === 'head_coach' || this.team?.userRole === 'assistant_coach';
  }

  canRemoveMember(member: TeamMember): boolean {
    return this.team?.userRole === 'head_coach' && member.role !== 'head_coach';
  }

  canChangeRole(member: TeamMember): boolean {
    return this.team?.userRole === 'head_coach' && member.role !== 'head_coach';
  }

  goBack(): void {
    this.router.navigate(['/teams']);
  }

  // Additional helper methods for member management
  canManageMembers(): boolean {
    return this.canInviteMembers();
  }

  canManageTeam(): boolean {
    return this.canEditTeam();
  }

  openPlayerModal(): void {
    this.openCreatePlayerModal();
  }

  sendInvitation(): void {
    this.inviteUser();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'head_coach':
        return 'bg-purple-100 text-purple-800';
      case 'assistant_coach':
        return 'bg-blue-100 text-blue-800';
      case 'player':
        return 'bg-green-100 text-green-800';
      case 'parent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  changeRole(member: TeamMember): void {
    // This method can be implemented later for inline role changes
    console.log('Change role for:', member);
  }
}
