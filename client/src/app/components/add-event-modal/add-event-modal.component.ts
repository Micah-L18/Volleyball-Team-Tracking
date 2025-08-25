import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ScheduleService, ScheduleEvent, CreateScheduleEventRequest } from '../../services/schedule.service';
import { ModalService } from '../../services/modal.service';
import { ModalComponent } from '../modal/modal.component';
import { Team } from '../../models/types';

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal (closed)="onModalClosed()">
      <form (ngSubmit)="createEvent()" #eventForm="ngForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Event Type -->
          <div>
            <label for="eventType" class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              id="eventType"
              [(ngModel)]="newEvent.event_type"
              name="eventType"
              required
              (ngModelChange)="onEventTypeChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select type...</option>
              <option value="Practice">Practice</option>
              <option value="Game">Game</option>
              <option value="Scrimmage">Scrimmage</option>
              <option value="Tournament">Tournament</option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              id="title"
              [(ngModel)]="newEvent.title"
              name="title"
              required
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event title">
          </div>

          <!-- Date -->
          <div>
            <label for="eventDate" class="block text-sm font-medium text-gray-700 mb-1">
              {{ newEvent.event_type === 'Tournament' ? 'Start Date' : 'Date' }}
            </label>
            <input
              type="date"
              id="eventDate"
              [(ngModel)]="newEvent.event_date"
              name="eventDate"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          </div>

          <!-- End Date (for tournaments) -->
          <div *ngIf="newEvent.event_type === 'Tournament'">
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
            <input
              type="date"
              id="endDate"
              [(ngModel)]="newEvent.end_date"
              name="endDate"
              (ngModelChange)="onEndDateChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          </div>

          <!-- Start Time (not for multi-day tournaments) -->
          <div *ngIf="newEvent.event_type !== 'Tournament' || !newEvent.end_date">
            <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">Start Time (optional)</label>
            <input
              type="time"
              id="startTime"
              [(ngModel)]="newEvent.start_time"
              name="startTime"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          </div>

          <!-- End Time (not for multi-day tournaments) -->
          <div *ngIf="newEvent.event_type !== 'Tournament' || !newEvent.end_date">
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
            <input
              type="time"
              id="endTime"
              [(ngModel)]="newEvent.end_time"
              name="endTime"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input
              type="text"
              id="location"
              [(ngModel)]="newEvent.location"
              name="location"
              maxlength="200"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event location">
          </div>

          <!-- Opponent (for games/scrimmages) -->
          <div *ngIf="newEvent.event_type === 'Game' || newEvent.event_type === 'Scrimmage'">
            <label for="opponent" class="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
            <input
              type="text"
              id="opponent"
              [(ngModel)]="newEvent.opponent"
              name="opponent"
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Opponent team">
          </div>
        </div>

        <!-- Description -->
        <div class="mt-4">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            id="description"
            [(ngModel)]="newEvent.description"
            name="description"
            rows="3"
            maxlength="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Event details, notes, or instructions..."></textarea>
        </div>

        <!-- Recurring Event Options -->
        <div class="mt-4 border-t border-gray-200 pt-4">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Recurring Event (optional)</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Recurrence Type -->
            <div>
              <label for="recurrenceType" class="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
              <select
                id="recurrenceType"
                [(ngModel)]="newEvent.recurrence_type"
                name="recurrenceType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option [ngValue]="null">No repeat</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <!-- Recurrence End Date -->
            <div *ngIf="newEvent.recurrence_type">
              <label for="recurrenceEndDate" class="block text-sm font-medium text-gray-700 mb-1">Repeat until</label>
              <input
                type="date"
                id="recurrenceEndDate"
                [(ngModel)]="newEvent.recurrence_end_date"
                name="recurrenceEndDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>

          <!-- Days of Week (for weekly/biweekly) -->
          <div *ngIf="newEvent.recurrence_type === 'weekly' || newEvent.recurrence_type === 'biweekly'" class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">Days of the week</label>
            <div class="flex gap-2 flex-wrap">
              <label *ngFor="let day of weekDays; let i = index" class="flex items-center">
                <input
                  type="checkbox"
                  [checked]="newEvent.recurrence_days_of_week?.includes(i)"
                  (change)="toggleDayOfWeek(i)"
                  class="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <span class="text-sm text-gray-700">{{ day }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1">Select the days when this event should repeat</p>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-6">
          <button
            type="button"
            (click)="cancelCreate()"
            class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="!eventForm.form.valid || creating"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create Event' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: []
})
export class AddEventModalComponent implements OnInit, OnDestroy {
  @Input() team?: Team;
  @Output() eventCreated = new EventEmitter<ScheduleEvent>();

  creating = false;
  error = '';
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  newEvent: CreateScheduleEventRequest = {
    team_id: 0,
    event_type: 'Practice',
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    opponent: '',
    recurrence_type: null,
    recurrence_interval: 1,
    recurrence_end_date: '',
    recurrence_days_of_week: []
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private scheduleService: ScheduleService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.resetNewEvent();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onEventTypeChange(): void {
    // Clear opponent for non-game/scrimmage events
    if (this.newEvent.event_type !== 'Game' && this.newEvent.event_type !== 'Scrimmage') {
      this.newEvent.opponent = '';
    }
  }

  onEndDateChange(): void {
    // Clear time fields when tournament becomes multi-day
    if (this.newEvent.event_type === 'Tournament' && this.newEvent.end_date) {
      this.newEvent.start_time = '';
      this.newEvent.end_time = '';
    }
  }

  toggleDayOfWeek(dayIndex: number): void {
    if (!this.newEvent.recurrence_days_of_week) {
      this.newEvent.recurrence_days_of_week = [];
    }
    
    const index = this.newEvent.recurrence_days_of_week.indexOf(dayIndex);
    if (index > -1) {
      this.newEvent.recurrence_days_of_week.splice(index, 1);
    } else {
      this.newEvent.recurrence_days_of_week.push(dayIndex);
    }
  }

  createEvent(): void {
    if (!this.newEvent.title || !this.newEvent.event_type || !this.newEvent.event_date) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.creating = true;
    this.error = '';

    // Clean up data - convert empty strings to undefined for optional fields
    const eventData = {
      ...this.newEvent,
      end_date: this.newEvent.end_date || undefined,
      start_time: this.newEvent.start_time || undefined,
      end_time: this.newEvent.end_time || undefined,
      location: this.newEvent.location || undefined,
      opponent: this.newEvent.opponent || undefined,
      description: this.newEvent.description || undefined,
      recurrence_type: this.newEvent.recurrence_type || undefined,
      recurrence_end_date: this.newEvent.recurrence_end_date || undefined,
      recurrence_days_of_week: this.newEvent.recurrence_days_of_week?.length ? this.newEvent.recurrence_days_of_week : undefined
    };

    const subscription = this.scheduleService.createEvent(eventData).subscribe({
      next: (event) => {
        this.creating = false;
        this.eventCreated.emit(event);
        this.modalService.close();
        this.resetNewEvent();
      },
      error: (error: any) => {
        console.error('Error creating event:', error);
        
        // Handle validation errors with details
        if (error.error?.details && Array.isArray(error.error.details)) {
          const validationErrors = error.error.details.map((detail: any) => detail.msg).join(', ');
          this.error = `Validation error: ${validationErrors}`;
        } else {
          this.error = error.error?.error || 'Failed to create event';
        }
        
        this.creating = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  cancelCreate(): void {
    this.modalService.close();
    this.resetNewEvent();
  }

  onModalClosed(): void {
    this.resetNewEvent();
  }

  private resetNewEvent(): void {
    this.newEvent = {
      team_id: this.team?.id || 0,
      event_type: 'Practice',
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      opponent: '',
      recurrence_type: null,
      recurrence_interval: 1,
      recurrence_end_date: '',
      recurrence_days_of_week: []
    };
    this.error = '';
  }
}
