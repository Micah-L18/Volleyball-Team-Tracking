import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
  id?: number;
  event_id: number;
  player_id: number;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
  marked_by?: number;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  jersey_number?: number;
  marked_by_first_name?: string;
  marked_by_last_name?: string;
}

export interface AttendanceData {
  playerId: number;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

export interface AttendanceSummary {
  player_id: number;
  first_name: string;
  last_name: string;
  jersey_number: number;
  present_count: number;
  absent_count: number;
  excused_count: number;
  late_count: number;
  total_events_with_attendance: number;
  attendance_percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  // Get attendance for a specific event
  getEventAttendance(eventId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/event/${eventId}`);
  }

  // Get attendance history for a specific player
  getPlayerAttendance(playerId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/player/${playerId}`);
  }

  // Mark attendance for multiple players
  markAttendance(eventId: number, attendanceData: AttendanceData[]): Observable<{ message: string; attendance: AttendanceRecord[] }> {
    return this.http.post<{ message: string; attendance: AttendanceRecord[] }>(`${this.apiUrl}/mark`, {
      eventId,
      attendanceData
    });
  }

  // Get attendance summary/statistics
  getAttendanceSummary(teamId: number, startDate?: string, endDate?: string): Observable<AttendanceSummary[]> {
    let url = `${this.apiUrl}/summary/${teamId}`;
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<AttendanceSummary[]>(url);
  }

  // Helper methods for UI
  getAttendanceStatusColor(status: string): string {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'excused':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'late':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getAttendanceStatusIcon(status: string): string {
    switch (status) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'excused':
        return '⚠️';
      case 'late':
        return '⏰';
      default:
        return '❓';
    }
  }

  formatAttendancePercentage(percentage: number): string {
    if (percentage === null || percentage === undefined) {
      return 'N/A';
    }
    return `${percentage.toFixed(1)}%`;
  }
}
