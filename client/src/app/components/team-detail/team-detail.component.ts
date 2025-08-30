import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { TeamMemberService } from '../../services/team-member.service';
import { TeamDetails, TeamMember } from '../../models/types';
import { Player, CreatePlayerRequest, VOLLEYBALL_POSITIONS, PLAYER_YEARS, DOMINANT_HANDS } from '../../interfaces/player.interface';
import { SkillRatingComponent } from '../skill-rating/skill-rating.component';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';
import { ScheduleComponent } from '../schedule/schedule.component';
import { StatisticsDashboardComponent } from '../statistics-dashboard/statistics-dashboard.component';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SkillRatingComponent, AnalyticsDashboardComponent, ScheduleComponent, StatisticsDashboardComponent, VideoGalleryComponent],
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
  activeTab: 'info' | 'members' | 'players' | 'skills' | 'analytics' | 'schedule' | 'statistics' | 'videos' = 'info';
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

  // Bulk import
  showBulkImportModal = false;
  bulkImportMethod: 'text' | 'csv' = 'text';
  bulkImportText = '';
  csvFileName = '';
  parsedPlayers: any[] = [];
  bulkImportErrors: string[] = [];
  submittingBulkImport = false;

  // Role editing
  editingMemberId: number | null = null;
  savingRole = false;
  memberToRemove: TeamMember | null = null;
  successMessage = '';
  errorMessage = '';

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

  availableRoles = [
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
    private teamMemberService: TeamMemberService,
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
  setActiveTab(tab: 'info' | 'members' | 'players' | 'skills' | 'analytics' | 'schedule' | 'statistics' | 'videos'): void {
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
    if (confirm(`Are you sure you want to delete ${this.getPlayerDisplayName(player)}? This action cannot be undone.`)) {
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

  // Bulk import methods
  openBulkImportModal(): void {
    this.showBulkImportModal = true;
    this.bulkImportMethod = 'text';
    this.bulkImportText = '';
    this.csvFileName = '';
    this.parsedPlayers = [];
    this.bulkImportErrors = [];
  }

  closeBulkImportModal(): void {
    this.showBulkImportModal = false;
    this.bulkImportText = '';
    this.csvFileName = '';
    this.parsedPlayers = [];
    this.bulkImportErrors = [];
  }

  canParseBulkData(): boolean {
    return (this.bulkImportMethod === 'text' && this.bulkImportText.trim().length > 0) ||
           (this.bulkImportMethod === 'csv' && this.csvFileName.length > 0);
  }

  onCsvFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.csvFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bulkImportText = e.target?.result as string;
      };
      reader.readAsText(file);
    }
  }

  parseBulkImportData(): void {
    this.parsedPlayers = [];
    this.bulkImportErrors = [];

    if (!this.bulkImportText.trim()) {
      this.bulkImportErrors.push('No data to parse');
      return;
    }

    const lines = this.bulkImportText.trim().split('\n');
    let isFirstLine = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        let playerData: any = {};

        if (this.bulkImportMethod === 'csv') {
          // Handle CSV format
          const values = this.parseCSVLine(line);
          
          if (isFirstLine && this.looksLikeHeader(values)) {
            isFirstLine = false;
            continue; // Skip header row
          }
          
          // Map CSV values to player fields
          playerData = {
            first_name: values[0]?.trim() || '',
            jersey_number: values[1]?.trim() ? parseInt(values[1].trim()) : null,
            position: values[2]?.trim() || '',
            year: values[3]?.trim() || '',
            height: values[4]?.trim() ? parseFloat(values[4].trim()) : null,
            reach: values[5]?.trim() ? parseFloat(values[5].trim()) : null,
            dominant_hand: values[6]?.trim() || '',
            contact_info: values[7]?.trim() || '',
            notes: values[8]?.trim() || ''
          };
        } else {
          // Handle text format (comma-separated)
          const parts = line.split(',').map(p => p.trim());
          
          if (parts.length === 0 || !parts[0]) {
            this.bulkImportErrors.push(`Line ${i + 1}: Missing player name`);
            continue;
          }

          // Parse name (could be "First Last" or just "First")
          const nameParts = parts[0].trim().split(' ');
          playerData.first_name = nameParts[0];
          if (nameParts.length > 1) {
            playerData.last_name = nameParts.slice(1).join(' ');
          }

          // Parse other fields
          if (parts[1]) playerData.jersey_number = parseInt(parts[1]);
          if (parts[2]) playerData.position = parts[2];
          if (parts[3]) playerData.year = parts[3];
          if (parts[4]) playerData.height = parseFloat(parts[4]);
          if (parts[5]) playerData.reach = parseFloat(parts[5]);
          if (parts[6]) playerData.dominant_hand = parts[6];
          if (parts[7]) playerData.contact_info = parts[7];
          if (parts[8]) playerData.notes = parts[8];
        }

        // Validate required fields
        if (!playerData.first_name) {
          this.bulkImportErrors.push(`Line ${i + 1}: Missing player name`);
          continue;
        }

        // Validate optional fields
        if (playerData.jersey_number && (playerData.jersey_number < 0 || playerData.jersey_number > 99)) {
          this.bulkImportErrors.push(`Line ${i + 1}: Jersey number must be between 0-99`);
          continue;
        }

        if (playerData.position && !['setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist'].includes(playerData.position)) {
          this.bulkImportErrors.push(`Line ${i + 1}: Invalid position "${playerData.position}"`);
          continue;
        }

        if (playerData.year && !['freshman', 'sophomore', 'junior', 'senior', 'graduate'].includes(playerData.year)) {
          this.bulkImportErrors.push(`Line ${i + 1}: Invalid year "${playerData.year}"`);
          continue;
        }

        this.parsedPlayers.push(playerData);

      } catch (error) {
        this.bulkImportErrors.push(`Line ${i + 1}: Parse error - ${error}`);
      }

      isFirstLine = false;
    }

    if (this.parsedPlayers.length === 0 && this.bulkImportErrors.length === 0) {
      this.bulkImportErrors.push('No valid player data found');
    }
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private looksLikeHeader(values: string[]): boolean {
    const firstValue = values[0]?.toLowerCase().trim();
    return firstValue === 'name' || firstValue === 'first_name' || firstValue === 'player_name';
  }

  submitBulkImport(): void {
    if (this.parsedPlayers.length === 0 || !this.team) {
      return;
    }

    this.submittingBulkImport = true;

    this.playerService.bulkImportPlayers(this.team.id!, this.parsedPlayers).subscribe({
      next: (response: any) => {
        console.log('Bulk import successful:', response);
        alert(`Successfully imported ${response.summary.successful} players!`);
        this.closeBulkImportModal();
        if (this.team) {
          this.loadTeamPlayers(this.team.id!); // Refresh players list
        }
      },
      error: (error: any) => {
        console.error('Bulk import error:', error);
        alert(`Failed to import players: ${error.error?.error || error.message}`);
        this.submittingBulkImport = false;
      }
    });
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

  // Role editing methods
  startEditRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    if (this.editingMemberId) return;
    
    member.editingRole = true;
    member.newRole = member.role;
    this.editingMemberId = member.id;
    this.clearMessages();
    console.log('Starting edit for member:', member); // Debug log
  }

  cancelEditRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    member.editingRole = false;
    member.newRole = undefined;
    this.editingMemberId = null;
  }

  saveRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    if (!member.newRole || this.savingRole || !this.team?.id || !member.id) return;

    console.log('Saving role for member:', member); // Debug log
    console.log('Team ID:', this.team.id, 'Member ID:', member.id, 'New Role:', member.newRole); // Debug log

    this.savingRole = true;
    this.clearMessages();

    this.teamMemberService.updateMemberRole(this.team.id, member.id, member.newRole).subscribe({
      next: (response) => {
        console.log('Role update response:', response); // Debug log
        member.role = member.newRole as any;
        member.editingRole = false;
        member.newRole = undefined;
        this.editingMemberId = null;
        this.savingRole = false;
        this.successMessage = response.message;
        this.autoHideMessage();
      },
      error: (error) => {
        console.error('Error updating member role:', error);
        this.errorMessage = error.error?.error || 'Failed to update member role';
        this.savingRole = false;
        this.autoHideMessage();
      }
    });
  }

  confirmRemoveMember(member: TeamMember): void {
    this.memberToRemove = member;
  }

  cancelRemoveMember(): void {
    this.memberToRemove = null;
  }

  removeMemberConfirmed(): void {
    if (!this.memberToRemove?.id || !this.team?.id) return;

    this.teamMemberService.removeMember(this.team.id, this.memberToRemove.id).subscribe({
      next: (response) => {
        if (this.team && this.team.members) {
          this.team.members = this.team.members.filter(m => m.id !== this.memberToRemove!.id);
        }
        this.successMessage = response.message;
        this.memberToRemove = null;
        this.autoHideMessage();
      },
      error: (error) => {
        console.error('Error removing member:', error);
        this.errorMessage = error.error?.error || 'Failed to remove member';
        this.autoHideMessage();
      }
    });
  }

  canEditMemberRoles(): boolean {
    return this.team?.userRole === 'head_coach';
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private autoHideMessage(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  changeRole(member: TeamMember): void {
    // This method can be implemented later for inline role changes
    console.log('Change role for:', member);
  }

  trackByMemberId(index: number, member: TeamMember): number {
    return member.id;
  }

  isEditingRole(member: TeamMember): boolean {
    return (member as any).editingRole || false;
  }

  getMemberNewRole(member: TeamMember): string {
    return (member as any).newRole || member.role;
  }

  setMemberNewRole(member: TeamMember, role: string): void {
    (member as any).newRole = role;
  }
}
