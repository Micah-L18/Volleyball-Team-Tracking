import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Team, TeamDetails, TeamMember } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = 'http://localhost:3002/api/teams';
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  public teams$ = this.teamsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Get all teams for the authenticated user
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap(teams => this.teamsSubject.next(teams))
    );
  }

  // Create a new team
  createTeam(teamData: {
    name: string;
    description?: string;
    season: string;
    age_group?: string;
  }): Observable<{message: string, team: Team}> {
    return this.http.post<{message: string, team: Team}>(
      this.apiUrl,
      teamData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        const currentTeams = this.teamsSubject.value;
        this.teamsSubject.next([...currentTeams, response.team]);
      })
    );
  }

  // Get specific team details
  getTeamDetails(teamId: number): Observable<TeamDetails> {
    return this.http.get<TeamDetails>(`${this.apiUrl}/${teamId}`, {
      headers: this.getHeaders()
    });
  }

  // Update team information
  updateTeam(teamId: number, teamData: {
    name: string;
    description?: string;
    season: string;
    age_group?: string;
  }): Observable<{message: string, team: Team}> {
    return this.http.put<{message: string, team: Team}>(
      `${this.apiUrl}/${teamId}`,
      teamData,
      { headers: this.getHeaders() }
    );
  }

  // Invite user to team
  inviteUser(teamId: number, email: string, role: string): Observable<{message: string, member: TeamMember}> {
    return this.http.post<{message: string, member: TeamMember}>(
      `${this.apiUrl}/${teamId}/invite`,
      { email, role },
      { headers: this.getHeaders() }
    );
  }

  // Remove user from team
  removeMember(teamId: number, userId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.apiUrl}/${teamId}/members/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  // Update member role
  updateMemberRole(teamId: number, userId: number, role: string): Observable<{message: string}> {
    return this.http.put<{message: string}>(
      `${this.apiUrl}/${teamId}/members/${userId}/role`,
      { role },
      { headers: this.getHeaders() }
    );
  }

  // Clear teams data (for logout)
  clearTeams(): void {
    this.teamsSubject.next([]);
  }
}
