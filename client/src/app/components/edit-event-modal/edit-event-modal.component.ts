import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ScheduleService, ScheduleEvent, UpdateScheduleEventRequest } from '../../services/schedule.service';
import { Team } from '../../models/types';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-edit-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      *ngIf="isVisible" 
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      (click)="onBackdropClick($event)">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-medium text-gray-900">Edit Event</h3>
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
                <h3 class="text-sm font-medium text-red-800">Error updating event</h3>
                <div class="mt-2 text-sm text-red-700">
                  <div *ngIf="error.error?.errors?.length; else generalError">
                    <ul class="list-disc list-inside space-y-1">
                      <li *ngFor="let err of error.error.errors">{{ err.msg }}</li>
                    </ul>
                  </div>
                  <ng-template #generalError>
                    <p>{{ error.message || 'An unexpected error occurred while updating the event.' }}</p>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form (ngSubmit)="updateEvent()" #eventForm="ngForm" class="space-y-4">
            <!-- Event Type -->
            <div>
              <label for="eventType" class="block text-sm font-medium text-gray-700 mb-1">
                Event Type <span class="text-red-500">*</span>
              </label>
              <select
                id="eventType"
                name="eventType"
                [(ngModel)]="formData.event_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select event type</option>
                <option value="Practice">Practice</option>
                <option value="Game">Game</option>
                <option value="Scrimmage">Scrimmage</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>

            <!-- Title -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                Event Title <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                [(ngModel)]="formData.title"
                required
                maxlength="255"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title">
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="eventDate" class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  [(ngModel)]="formData.event_date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>

              <div>
                <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span class="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  [(ngModel)]="formData.end_date"
                  [min]="formData.event_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>

            <!-- Time Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span class="text-gray-400">(optional)</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  [(ngModel)]="formData.start_time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>

              <div>
                <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span class="text-gray-400">(optional)</span>
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  [(ngModel)]="formData.end_time"
                  [min]="formData.start_time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>

            <!-- Location -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
                Location <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                [(ngModel)]="formData.location"
                maxlength="255"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event location">
            </div>

            <!-- Opponent (for games/scrimmages) -->
            <div *ngIf="formData.event_type === 'Game' || formData.event_type === 'Scrimmage'">
              <label for="opponent" class="block text-sm font-medium text-gray-700 mb-1">
                Opponent <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="opponent"
                name="opponent"
                [(ngModel)]="formData.opponent"
                maxlength="255"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter opponent name">
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Description <span class="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                [(ngModel)]="formData.description"
                rows="3"
                maxlength="1000"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event description or notes"></textarea>
            </div>

            <!-- Recurring Event Options -->
            <div *ngIf="!isRecurringChild" class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Recurring Event Options</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="recurrenceType" class="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence Type
                  </label>
                  <select
                    id="recurrenceType"
                    name="recurrenceType"
                    [(ngModel)]="formData.recurrence_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">No recurrence</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div *ngIf="formData.recurrence_type">
                  <label for="recurrenceInterval" class="block text-sm font-medium text-gray-700 mb-1">
                    Repeat Every
                  </label>
                  <input
                    type="number"
                    id="recurrenceInterval"
                    name="recurrenceInterval"
                    [(ngModel)]="formData.recurrence_interval"
                    min="1"
                    max="30"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1">
                </div>
              </div>

              <div *ngIf="formData.recurrence_type" class="mt-4">
                <label for="recurrenceEndDate" class="block text-sm font-medium text-gray-700 mb-1">
                  End Recurrence Date <span class="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  id="recurrenceEndDate"
                  name="recurrenceEndDate"
                  [(ngModel)]="formData.recurrence_end_date"
                  [min]="formData.event_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>

              <div *ngIf="formData.recurrence_type === 'weekly'" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </label>
                <div class="flex flex-wrap gap-2">
                  <label *ngFor="let day of daysOfWeek" class="inline-flex items-center">
                    <input
                      type="checkbox"
                      [value]="day.value"
                      (change)="onDayOfWeekChange(day.value, $event)"
                      [checked]="isDaySelected(day.value)"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    <span class="ml-2 text-sm text-gray-700">{{ day.label }}</span>
                  </label>
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
                type="submit"
                [disabled]="!eventForm.form.valid || loading"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ loading ? 'Updating...' : 'Update Event' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EditEventModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() team!: Team;
  @Input() event!: ScheduleEvent;
  @Input() isVisible: boolean = false;
  @Output() eventUpdated = new EventEmitter<ScheduleEvent>();
  @Output() modalClosed = new EventEmitter<void>();

  formData: UpdateScheduleEventRequest = {
    event_type: undefined,
    title: '',
    event_date: '',
    end_date: undefined,
    start_time: undefined,
    end_time: undefined,
    location: undefined,
    opponent: undefined,
    description: undefined,
    recurrence_type: undefined,
    recurrence_interval: 1,
    recurrence_end_date: undefined,
    recurrence_days_of_week: []
  };

  // Additional property for template checks
  isRecurringChild = false;

  loading = false;
  error: any = null;

  daysOfWeek = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    // Populate form when component initializes and has event data
    if (this.event && this.isVisible) {
      this.populateForm();
    }
  }

  ngOnChanges(): void {
    // Populate form when event or visibility changes
    if (this.event && this.isVisible) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private populateForm(): void {
    if (!this.event) return;

    this.formData = {
      event_type: this.event.event_type || undefined,
      title: this.event.title || '',
      event_date: this.event.event_date || '',
      end_date: this.event.end_date || undefined,
      start_time: this.event.start_time || undefined,
      end_time: this.event.end_time || undefined,
      location: this.event.location || undefined,
      opponent: this.event.opponent || undefined,
      description: this.event.description || undefined,
      recurrence_type: this.event.recurrence_type || undefined,
      recurrence_interval: this.event.recurrence_interval || 1,
      recurrence_end_date: this.event.recurrence_end_date || undefined,
      recurrence_days_of_week: this.event.recurrence_days_of_week ? [...this.event.recurrence_days_of_week] : []
    };
    
    this.isRecurringChild = !!this.event.parent_event_id;
  }

  onDayOfWeekChange(day: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!this.formData.recurrence_days_of_week) {
      this.formData.recurrence_days_of_week = [];
    }
    
    if (target.checked) {
      if (!this.formData.recurrence_days_of_week.includes(day)) {
        this.formData.recurrence_days_of_week.push(day);
      }
    } else {
      this.formData.recurrence_days_of_week = this.formData.recurrence_days_of_week.filter(d => d !== day);
    }
  }

  isDaySelected(day: number): boolean {
    return this.formData.recurrence_days_of_week?.includes(day) || false;
  }

  updateEvent(): void {
    if (!this.event?.id || !this.team?.id || this.loading) return;

    this.loading = true;
    this.error = null;

    // Clean up form data - convert empty strings to undefined for optional fields
    const cleanData: UpdateScheduleEventRequest = {
      event_type: this.formData.event_type,
      title: this.formData.title,
      event_date: this.formData.event_date,
      end_date: this.formData.end_date || undefined,
      start_time: this.formData.start_time || undefined,
      end_time: this.formData.end_time || undefined,
      location: this.formData.location || undefined,
      opponent: this.formData.opponent || undefined,
      description: this.formData.description || undefined,
      recurrence_type: this.formData.recurrence_type || undefined,
      recurrence_interval: this.formData.recurrence_type ? this.formData.recurrence_interval : undefined,
      recurrence_end_date: this.formData.recurrence_end_date || undefined,
      recurrence_days_of_week: (this.formData.recurrence_days_of_week && this.formData.recurrence_days_of_week.length > 0) ? this.formData.recurrence_days_of_week : undefined
    };

    const subscription = this.scheduleService.updateEvent(this.event.id, cleanData).subscribe({
      next: (updatedEvent) => {
        this.eventUpdated.emit(updatedEvent);
        this.closeModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating event:', error);
        this.error = error;
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
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
