import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/types';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  loading = true;
  error = '';
  showCreateForm = false;

  newTeam = {
    name: '',
    description: '',
    season: '',
    age_group: ''
  };

  constructor(private teamService: TeamService) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.error = '';
    
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.error = 'Failed to load teams. Please try again.';
        this.loading = false;
      }
    });
  }

  createTeam(): void {
    if (!this.newTeam.name.trim() || !this.newTeam.season.trim()) {
      this.error = 'Team name and season are required';
      return;
    }

    this.teamService.createTeam(this.newTeam).subscribe({
      next: (response) => {
        console.log('Team created successfully:', response);
        this.resetForm();
        this.loadTeams(); // Refresh the list
      },
      error: (error) => {
        console.error('Error creating team:', error);
        this.error = error.error?.error || 'Failed to create team. Please try again.';
      }
    });
  }

  resetForm(): void {
    this.newTeam = {
      name: '',
      description: '',
      season: '',
      age_group: ''
    };
    this.showCreateForm = false;
    this.error = '';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
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

  canCreateTeam(): boolean {
    // Any user can create a team (they become the head coach)
    return true;
  }
}
