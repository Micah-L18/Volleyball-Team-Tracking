import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ScheduleEvent {
  id?: number;
  team_id: number;
  event_type: 'Practice' | 'Scrimmage' | 'Game' | 'Tournament';
  title: string;
  description?: string;
  event_date: string; // ISO date string
  end_date?: string; // ISO date string for multi-day tournaments
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  location?: string;
  opponent?: string;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
  parent_event_id?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  team_name?: string;
}

export interface CreateScheduleEventRequest {
  team_id: number;
  event_type: ScheduleEvent['event_type'];
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  opponent?: string;
  recurrence_type?: ScheduleEvent['recurrence_type'];
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_days_of_week?: number[];
}

export interface UpdateScheduleEventRequest {
  event_type?: ScheduleEvent['event_type'];
  title?: string;
  description?: string;
  event_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  opponent?: string;
  recurrence_type?: ScheduleEvent['recurrence_type'];
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_days_of_week?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/schedule`;

  constructor(private http: HttpClient) {}

  // Get all events for a team
  getTeamSchedule(teamId: number): Observable<ScheduleEvent[]> {
    return this.http.get<ScheduleEvent[]>(`${this.apiUrl}/team/${teamId}`);
  }

  // Get upcoming events for a team
  getUpcomingEvents(teamId: number, limit: number = 10): Observable<ScheduleEvent[]> {
    return this.http.get<ScheduleEvent[]>(`${this.apiUrl}/team/${teamId}/upcoming?limit=${limit}`);
  }

  // Get single event
  getEvent(eventId: number): Observable<ScheduleEvent> {
    return this.http.get<ScheduleEvent>(`${this.apiUrl}/${eventId}`);
  }

  // Create new event
  createEvent(event: CreateScheduleEventRequest): Observable<ScheduleEvent> {
    return this.http.post<ScheduleEvent>(this.apiUrl, event);
  }

  // Update event
  updateEvent(eventId: number, event: UpdateScheduleEventRequest): Observable<ScheduleEvent> {
    return this.http.put<ScheduleEvent>(`${this.apiUrl}/${eventId}`, event);
  }

  // Delete event
  deleteEvent(eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${eventId}`);
  }

  // Helper methods for UI
  getEventTypeIcon(eventType: ScheduleEvent['event_type']): string {
    switch (eventType) {
      case 'Practice': return '🏐';
      case 'Game': return '🏆';
      case 'Scrimmage': return '⚡';
      case 'Tournament': return '🏅';
      default: return '📅';
    }
  }

  getEventTypeColor(eventType: ScheduleEvent['event_type']): string {
    switch (eventType) {
      case 'Practice': return 'bg-blue-100 text-blue-800';
      case 'Game': return 'bg-red-100 text-red-800';
      case 'Scrimmage': return 'bg-yellow-100 text-yellow-800';
      case 'Tournament': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatEventTime(startTime?: string, endTime?: string): string {
    if (!startTime && !endTime) return 'All Day';
    if (startTime && !endTime) return this.formatTime(startTime);
    if (!startTime && endTime) return `Until ${this.formatTime(endTime)}`;
    return `${this.formatTime(startTime!)} - ${this.formatTime(endTime!)}`;
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  isEventToday(dateString: string): boolean {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }

  isEventUpcoming(dateString: string): boolean {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate >= today;
  }
}
