import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Player, CreatePlayerRequest, UpdatePlayerRequest } from '../interfaces/player.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private readonly apiUrl = `${environment.apiUrl}/players`;
  
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  private selectedPlayerSubject = new BehaviorSubject<Player | null>(null);
  public selectedPlayer$ = this.selectedPlayerSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all players for authenticated user's teams
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl).pipe(
      tap(players => this.playersSubject.next(players))
    );
  }

  // Get players for a specific team
  getTeamPlayers(teamId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/team/${teamId}`);
  }

  // Get single player details
  getPlayer(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`).pipe(
      tap(player => this.selectedPlayerSubject.next(player))
    );
  }

  // Create new player
  createPlayer(playerData: CreatePlayerRequest): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, playerData).pipe(
      tap(newPlayer => {
        const currentPlayers = this.playersSubject.value;
        this.playersSubject.next([...currentPlayers, newPlayer]);
      })
    );
  }

  // Update player
  updatePlayer(id: number, playerData: UpdatePlayerRequest): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, playerData).pipe(
      tap(updatedPlayer => {
        const currentPlayers = this.playersSubject.value;
        const updatedPlayers = currentPlayers.map(player => 
          player.id === id ? updatedPlayer : player
        );
        this.playersSubject.next(updatedPlayers);
        
        // Update selected player if it's the one being updated
        if (this.selectedPlayerSubject.value?.id === id) {
          this.selectedPlayerSubject.next(updatedPlayer);
        }
      })
    );
  }

  // Delete player
  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentPlayers = this.playersSubject.value;
        const filteredPlayers = currentPlayers.filter(player => player.id !== id);
        this.playersSubject.next(filteredPlayers);
        
        // Clear selected player if it's the one being deleted
        if (this.selectedPlayerSubject.value?.id === id) {
          this.selectedPlayerSubject.next(null);
        }
      })
    );
  }

  // Utility methods
  clearSelectedPlayer(): void {
    this.selectedPlayerSubject.next(null);
  }

  // Filter players by team
  filterPlayersByTeam(teamId: number): Player[] {
    return this.playersSubject.value.filter(player => player.team_id === teamId);
  }

  // Search players by name or jersey number
  searchPlayers(searchTerm: string): Player[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return this.playersSubject.value;
    
    return this.playersSubject.value.filter(player => 
      player.name.toLowerCase().includes(term) ||
      (player.jersey_number && player.jersey_number.toString().includes(term))
    );
  }

  // Get players by position
  getPlayersByPosition(position: string): Player[] {
    return this.playersSubject.value.filter(player => player.position === position);
  }

  // Get current players count
  getPlayersCount(): number {
    return this.playersSubject.value.length;
  }

  // Get players count for a specific team
  getTeamPlayersCount(teamId: number): number {
    return this.playersSubject.value.filter(player => player.team_id === teamId).length;
  }

  // Format height for display (inches to feet'inches")
  formatHeight(inches?: number): string {
    if (!inches) return 'N/A';
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  }

  // Format reach for display
  formatReach(inches?: number): string {
    if (!inches) return 'N/A';
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  }

  // Get position display name
  getPositionDisplayName(position?: string): string {
    const positionMap: { [key: string]: string } = {
      'setter': 'Setter',
      'outside_hitter': 'Outside Hitter',
      'middle_blocker': 'Middle Blocker',
      'opposite': 'Opposite',
      'libero': 'Libero',
      'defensive_specialist': 'Defensive Specialist'
    };
    return positionMap[position || ''] || 'N/A';
  }

  // Get year display name
  getYearDisplayName(year?: string): string {
    const yearMap: { [key: string]: string } = {
      'freshman': 'Freshman',
      'sophomore': 'Sophomore',
      'junior': 'Junior',
      'senior': 'Senior',
      'graduate': 'Graduate'
    };
    return yearMap[year || ''] || 'N/A';
  }
}
