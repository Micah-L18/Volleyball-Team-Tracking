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
    { value: 'head_coach', label: 'Head Coach' },
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

    // Check if this is promoting someone to head coach
    if (member.newRole === 'head_coach' && member.role !== 'head_coach') {
      this.handleHeadCoachTransfer(member);
      return;
    }

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

  private handleHeadCoachTransfer(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    const memberName = `${member.first_name} ${member.last_name}` || member.email || 'this member';
    const confirmMessage = `Are you sure you want to transfer head coach ownership to ${memberName}?\n\n` +
                          `This will:\n` +
                          `• Make ${memberName} the new head coach and team owner\n` +
                          `• Change your role to assistant coach\n` +
                          `• Give them full control over the team\n\n` +
                          `This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.savingRole = true;
      this.clearMessages();

      if (!this.team?.id || !member.id) return;

      this.teamMemberService.updateMemberRole(this.team.id, member.id, member.newRole!, true).subscribe({
        next: (response) => {
          console.log('Head coach transfer response:', response);
          
          if (response.ownershipTransferred) {
            // Update the current member's role
            member.role = 'head_coach' as any;
            member.editingRole = false;
            member.newRole = undefined;
            this.editingMemberId = null;
            
            // Update current user's role in the team members list
            if (this.team && this.team.members) {
              // Get current user ID from auth service
              this.authService.getCurrentUser().subscribe(currentUser => {
                const currentMember = this.team!.members!.find(m => m.user_id === currentUser.id);
                if (currentMember) {
                  currentMember.role = 'assistant_coach';
                }
              });
            }
            
            // Update team user role
            if (this.team) {
              this.team.userRole = 'assistant_coach';
            }
            
            this.successMessage = `Head coach transferred successfully. ${memberName} is now the team owner.`;
          } else {
            this.successMessage = response.message;
          }
          
          this.savingRole = false;
          this.autoHideMessage();
        },
        error: (error) => {
          console.error('Error transferring head coach:', error);
          this.errorMessage = error.error?.error || 'Failed to transfer head coach ownership';
          this.savingRole = false;
          this.autoHideMessage();
        }
      });
    } else {
      // User cancelled, reset the role selection
      member.newRole = member.role;
    }
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
