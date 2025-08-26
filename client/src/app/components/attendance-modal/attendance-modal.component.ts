import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AttendanceService, AttendanceRecord, AttendanceData } from '../../services/attendance.service';
import { ScheduleEvent } from '../../services/schedule.service';
import { Player } from '../../models/types';

@Component({
  selector: 'app-attendance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      *ngIf="isVisible" 
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      (click)="onBackdropClick($event)">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Mark Attendance</h3>
              <p class="text-sm text-gray-600">{{ event.title }} - {{ event.event_date | date:'MMM d, yyyy' }}</p>
            </div>
            <button
              (click)="closeModal()"
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Error Display -->
          <div *ngIf="error" class="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error marking attendance</h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ error.message || 'An unexpected error occurred while marking attendance.' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance List -->
          <div class="space-y-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 mb-3">
                <div>Player</div>
                <div>Status</div>
                <div>Notes</div>
                <div>Quick Actions</div>
              </div>
            </div>

            <div class="max-h-96 overflow-y-auto space-y-2">
              <div 
                *ngFor="let player of players; trackBy: trackByPlayerId"
                class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="grid grid-cols-4 gap-4 items-center">
                  <!-- Player Info -->
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <div class="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {{ player.jersey_number }}
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ player.name }}</p>
                      <p class="text-xs text-gray-500">{{ player.position }}</p>
                    </div>
                  </div>

                  <!-- Status Dropdown -->
                  <div>
                    <select
                      [(ngModel)]="getAttendanceData(player.id!).status"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                      <option value="late">Late</option>
                    </select>
                  </div>

                  <!-- Notes -->
                  <div>
                    <input
                      type="text"
                      [(ngModel)]="getAttendanceData(player.id!).notes"
                      placeholder="Notes (optional)"
                      maxlength="500"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  </div>

                  <!-- Quick Actions -->
                  <div class="flex space-x-2">
                    <button
                      (click)="setQuickStatus(player.id!, 'present')"
                      class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      title="Mark Present">
                      ✅
                    </button>
                    <button
                      (click)="setQuickStatus(player.id!, 'absent')"
                      class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      title="Mark Absent">
                      ❌
                    </button>
                    <button
                      (click)="setQuickStatus(player.id!, 'excused')"
                      class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      title="Mark Excused">
                      ⚠️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-lg font-semibold text-green-600">{{ getSummary().present }}</div>
                <div class="text-xs text-gray-600">Present</div>
              </div>
              <div>
                <div class="text-lg font-semibold text-red-600">{{ getSummary().absent }}</div>
                <div class="text-xs text-gray-600">Absent</div>
              </div>
              <div>
                <div class="text-lg font-semibold text-yellow-600">{{ getSummary().excused }}</div>
                <div class="text-xs text-gray-600">Excused</div>
              </div>
              <div>
                <div class="text-lg font-semibold text-orange-600">{{ getSummary().late }}</div>
                <div class="text-xs text-gray-600">Late</div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button
              type="button"
              (click)="markAllPresent()"
              class="px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Mark All Present
            </button>
            <button
              type="button"
              (click)="saveAttendance()"
              [disabled]="loading || !hasValidAttendance()"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ loading ? 'Saving...' : 'Save Attendance' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AttendanceModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() event!: ScheduleEvent;
  @Input() players: Player[] = [];
  @Input() isVisible: boolean = false;
  @Output() attendanceMarked = new EventEmitter<AttendanceRecord[]>();
  @Output() modalClosed = new EventEmitter<void>();

  attendanceData: Map<number, AttendanceData> = new Map();
  loading = false;
  error: any = null;

  private subscriptions: Subscription[] = [];

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    if (this.players && this.players.length > 0) {
      this.initializeAttendanceData();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(): void {
    if (this.isVisible && this.players && this.players.length > 0) {
      this.initializeAttendanceData();
      this.loadExistingAttendance();
    }
  }

  private initializeAttendanceData(): void {
    this.attendanceData.clear();
    this.players.forEach(player => {
      if (player.id) {
        this.attendanceData.set(player.id, {
          playerId: player.id,
          status: 'present' as any,
          notes: ''
        });
      }
    });
  }

  private loadExistingAttendance(): void {
    if (!this.event?.id) return;

    const subscription = this.attendanceService.getEventAttendance(this.event.id).subscribe({
      next: (records) => {
        records.forEach(record => {
          const existing = this.attendanceData.get(record.player_id);
          if (existing) {
            existing.status = record.status;
            existing.notes = record.notes || '';
          }
        });
      },
      error: (error) => {
        console.error('Error loading existing attendance:', error);
      }
    });

    this.subscriptions.push(subscription);
  }

  getAttendanceData(playerId: number): AttendanceData {
    if (!this.attendanceData.has(playerId)) {
      this.attendanceData.set(playerId, {
        playerId,
        status: 'present' as any,
        notes: ''
      });
    }
    return this.attendanceData.get(playerId)!;
  }

  setQuickStatus(playerId: number, status: 'present' | 'absent' | 'excused' | 'late'): void {
    const data = this.getAttendanceData(playerId);
    data.status = status;
  }

  markAllPresent(): void {
    this.players.forEach(player => {
      if (player.id) {
        this.setQuickStatus(player.id, 'present');
      }
    });
  }

  getSummary() {
    const summary = { present: 0, absent: 0, excused: 0, late: 0 };
    
    this.attendanceData.forEach(data => {
      if (data.status) {
        summary[data.status]++;
      }
    });

    return summary;
  }

  hasValidAttendance(): boolean {
    return Array.from(this.attendanceData.values()).some(data => data.status);
  }

  saveAttendance(): void {
    if (!this.event?.id || this.loading) return;

    const attendanceArray = Array.from(this.attendanceData.values())
      .filter(data => data.status);

    if (attendanceArray.length === 0) {
      this.error = { message: 'Please mark attendance for at least one player.' };
      return;
    }

    this.loading = true;
    this.error = null;

    const subscription = this.attendanceService.markAttendance(this.event.id, attendanceArray).subscribe({
      next: (result) => {
        this.attendanceMarked.emit(result.attendance);
        this.closeModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error marking attendance:', error);
        this.error = error;
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  trackByPlayerId(index: number, player: Player): number {
    return player.id || index;
  }

  closeModal(): void {
    this.modalClosed.emit();
    this.error = null;
    this.loading = false;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
