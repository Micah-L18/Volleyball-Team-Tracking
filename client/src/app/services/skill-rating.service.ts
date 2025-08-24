import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VolleyballSkill {
  id: number;
  name: string;
  category: string;
  description: string;
  created_at?: string;
}

export interface SkillRating {
  id: number;
  player_id: number;
  skill_category: string;
  skill_name: string;
  skill_description: string;
  rating: number;
  notes?: string;
  rated_date: string;
  created_at: string;
  updated_at: string;
}

export interface TeamSkillAverage {
  skill_name: string;
  skill_category: string;
  average_rating: number;
  player_count: number;
  max_rating: number;
  min_rating: number;
}

export interface BulkRatingUpdate {
  skill_name: string;
  rating: number;
  notes?: string;
}

export interface BulkRatingRequest {
  ratings: BulkRatingUpdate[];
  rated_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillRatingService {
  private readonly apiUrl = `${environment.apiUrl}/skill-ratings`;
  
  private skillsSubject = new BehaviorSubject<VolleyballSkill[]>([]);
  public skills$ = this.skillsSubject.asObservable();

  private playerRatingsSubject = new BehaviorSubject<SkillRating[]>([]);
  public playerRatings$ = this.playerRatingsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all volleyball skills
  getSkills(): Observable<VolleyballSkill[]> {
    return this.http.get<VolleyballSkill[]>(`${this.apiUrl}/skills`).pipe(
      tap(skills => this.skillsSubject.next(skills))
    );
  }

  // Get skills by category
  getSkillsByCategory(category: string): Observable<VolleyballSkill[]> {
    return this.http.get<VolleyballSkill[]>(`${this.apiUrl}/skills/category/${category}`);
  }

  // Get player skill ratings
  getPlayerRatings(playerId: number): Observable<SkillRating[]> {
    return this.http.get<SkillRating[]>(`${this.apiUrl}/player/${playerId}`).pipe(
      tap(ratings => this.playerRatingsSubject.next(ratings))
    );
  }

  // Get team skill averages
  getTeamSkillAverages(teamId: number): Observable<TeamSkillAverage[]> {
    return this.http.get<TeamSkillAverage[]>(`${this.apiUrl}/team/${teamId}/averages`);
  }

  // Update/create single skill rating
  updateSkillRating(playerId: number, skillName: string, rating: number, notes?: string, ratedDate?: string): Observable<SkillRating> {
    const payload = {
      rating,
      notes: notes || '',
      rated_date: ratedDate || new Date().toISOString().split('T')[0]
    };
    
    return this.http.put<SkillRating>(`${this.apiUrl}/player/${playerId}/skill/${encodeURIComponent(skillName)}`, payload).pipe(
      tap(updatedRating => {
        const currentRatings = this.playerRatingsSubject.value;
        const index = currentRatings.findIndex(r => r.skill_name === skillName);
        if (index >= 0) {
          currentRatings[index] = updatedRating;
        } else {
          currentRatings.push(updatedRating);
        }
        this.playerRatingsSubject.next([...currentRatings]);
      })
    );
  }

  // Bulk update skill ratings
  bulkUpdateRatings(playerId: number, request: BulkRatingRequest): Observable<{message: string, ratings: SkillRating[]}> {
    return this.http.post<{message: string, ratings: SkillRating[]}>(`${this.apiUrl}/player/${playerId}/bulk-update`, request).pipe(
      tap(response => {
        this.playerRatingsSubject.next(response.ratings);
      })
    );
  }

  // Delete skill rating
  deleteSkillRating(playerId: number, skillName: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/player/${playerId}/skill/${encodeURIComponent(skillName)}`).pipe(
      tap(() => {
        const currentRatings = this.playerRatingsSubject.value;
        const filteredRatings = currentRatings.filter(r => r.skill_name !== skillName);
        this.playerRatingsSubject.next(filteredRatings);
      })
    );
  }

  // Helper methods
  getSkillsByCategories(): { [category: string]: VolleyballSkill[] } {
    const skills = this.skillsSubject.value;
    return skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as { [category: string]: VolleyballSkill[] });
  }

  getPlayerRatingBySkill(skillName: string): SkillRating | undefined {
    return this.playerRatingsSubject.value.find(r => r.skill_name === skillName);
  }

  getPlayerAverageByCategory(category: string): number {
    const ratings = this.playerRatingsSubject.value.filter(r => r.skill_category === category);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  getPlayerOverallAverage(): number {
    const ratings = this.playerRatingsSubject.value;
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  // Clear data (for logout)
  clearData(): void {
    this.skillsSubject.next([]);
    this.playerRatingsSubject.next([]);
  }

  // Clear player ratings only (for switching players)
  clearPlayerRatings(): void {
    this.playerRatingsSubject.next([]);
  }
}
