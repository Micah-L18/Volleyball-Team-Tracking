import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { TeamDetails, TeamMember } from '../../models/types';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  team: TeamDetails | null = null;
  loading = true;
  error = '';
  showInviteForm = false;
  showEditForm = false;

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

  constructor(
    private teamService: TeamService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const teamId = Number(params['id']);
      if (teamId) {
        this.loadTeamDetails(teamId);
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
        console.error('Error loading team details:', error);
        this.error = error.error?.error || 'Failed to load team details. Please try again.';
        this.loading = false;
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
}
