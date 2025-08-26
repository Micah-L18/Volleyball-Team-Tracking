import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TeamMember {
  id: number;
  user_id: number;
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
  player_id?: number;
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at?: string;
  email: string;
  first_name: string;
  last_name: string;
  player_first_name?: string;
  player_last_name?: string;
  jersey_number?: number;
}

export interface UpdateRoleRequest {
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
  transferOwnership?: boolean;
}

export interface UpdateRoleResponse {
  message: string;
  member: TeamMember;
  ownershipTransferred?: boolean;
  requiresTransferConfirmation?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  private readonly apiUrl = `${environment.apiUrl}/team-access`;

  constructor(private http: HttpClient) {}

  /**
   * Get all members of a team with their roles
   */
  getTeamMembers(teamId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/team/${teamId}/members`);
  }

  /**
   * Update a team member's role
   */
  updateMemberRole(teamId: number, memberId: number, role: string, transferOwnership?: boolean): Observable<UpdateRoleResponse> {
    const body: UpdateRoleRequest = { role: role as any };
    if (transferOwnership) {
      body.transferOwnership = transferOwnership;
    }
    
    return this.http.patch<UpdateRoleResponse>(
      `${this.apiUrl}/team/${teamId}/member/${memberId}/role`,
      body
    );
  }

  /**
   * Remove a member from the team
   */
  removeMember(teamId: number, memberId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/team/${teamId}/member/${memberId}`
    );
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'head_coach': 'Head Coach',
      'assistant_coach': 'Assistant Coach',
      'player': 'Player',
      'parent': 'Parent'
    };
    return roleMap[role] || role;
  }

  /**
   * Get role badge class for styling
   */
  getRoleBadgeClass(role: string): string {
    const classMap: { [key: string]: string } = {
      'head_coach': 'badge-primary',
      'assistant_coach': 'badge-secondary',
      'player': 'badge-success',
      'parent': 'badge-info'
    };
    return classMap[role] || 'badge-default';
  }

  /**
   * Check if user can edit roles (only head coaches)
   */
  canEditRoles(currentUserRole: string): boolean {
    return currentUserRole === 'head_coach';
  }

  /**
   * Get available roles for assignment
   */
  getAvailableRoles(): Array<{ value: string; label: string }> {
    return [
      { value: 'head_coach', label: 'Head Coach' },
      { value: 'assistant_coach', label: 'Assistant Coach' },
      { value: 'player', label: 'Player' },
      { value: 'parent', label: 'Parent' }
    ];
  }
}
