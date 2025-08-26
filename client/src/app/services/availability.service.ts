import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvailabilityRecord {
  id?: number;
  event_id: number;
  player_id: number;
  available: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  jersey_number?: number;
}

export interface PlayerEventAvailability {
  event_id: number;
  event_title: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  availability_id?: number;
  available: boolean;
  notes?: string;
  updated_at?: string;
}

export interface AvailabilityData {
  eventId: number;
  available: boolean;
  notes?: string;
}

export interface AvailabilitySummary {
  total_players: number;
  available: number;
  unavailable: number;
  no_response: number;
  players: {
    player_id: number;
    first_name: string;
    last_name: string;
    jersey_number: number;
    position: string;
    available: boolean;
    notes?: string;
    updated_at?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private apiUrl = `${environment.apiUrl}/availability`;

  constructor(private http: HttpClient) {}

  // Get availability for a specific event
  getEventAvailability(eventId: number): Observable<AvailabilityRecord[]> {
    return this.http.get<AvailabilityRecord[]>(`${this.apiUrl}/event/${eventId}`);
  }

  // Get availability for a specific player
  getPlayerAvailability(playerId: number): Observable<PlayerEventAvailability[]> {
    return this.http.get<PlayerEventAvailability[]>(`${this.apiUrl}/player/${playerId}`);
  }

  // Update availability for a single event
  updateAvailability(eventId: number, playerId: number, available: boolean, notes?: string): Observable<{ message: string; availability: AvailabilityRecord }> {
    return this.http.post<{ message: string; availability: AvailabilityRecord }>(`${this.apiUrl}/update`, {
      eventId,
      playerId,
      available,
      notes
    });
  }

  // Bulk update availability for multiple events
  bulkUpdateAvailability(playerId: number, availabilityData: AvailabilityData[]): Observable<{ message: string; availability: AvailabilityRecord[] }> {
    return this.http.post<{ message: string; availability: AvailabilityRecord[] }>(`${this.apiUrl}/bulk-update`, {
      playerId,
      availabilityData
    });
  }

  // Get availability summary for coaches
  getAvailabilitySummary(eventId: number): Observable<AvailabilitySummary> {
    return this.http.get<AvailabilitySummary>(`${this.apiUrl}/summary/${eventId}`);
  }

  // Helper methods for UI
  getAvailabilityStatusColor(available: boolean, hasResponse: boolean = true): string {
    if (!hasResponse) {
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
    return available 
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200';
  }

  getAvailabilityStatusIcon(available: boolean, hasResponse: boolean = true): string {
    if (!hasResponse) {
      return '❓';
    }
    return available ? '✅' : '❌';
  }

  getAvailabilityStatusText(available: boolean, hasResponse: boolean = true): string {
    if (!hasResponse) {
      return 'No Response';
    }
    return available ? 'Available' : 'Unavailable';
  }

  formatAvailabilityRate(available: number, total: number): string {
    if (total === 0) {
      return 'N/A';
    }
    const percentage = (available / total) * 100;
    return `${percentage.toFixed(1)}%`;
  }
}
