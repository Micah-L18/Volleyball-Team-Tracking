import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ScheduleService, ScheduleEvent, CreateScheduleEventRequest } from '../../services/schedule.service';
import { Team } from '../../models/types';
import { CalendarComponent } from '../calendar/calendar.component';
import { ModalService } from '../../services/modal.service';
import { AddEventModalComponent } from '../add-event-modal/add-event-modal.component';
import { EditEventModalComponent } from '../edit-event-modal/edit-event-modal.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent, AddEventModalComponent, EditEventModalComponent],
  template: `
    <!-- Add Event Modal - Always available -->
    <app-add-event-modal
      [team]="team"
      (eventCreated)="onEventCreated($event)">
    </app-add-event-modal>

    <!-- Edit Event Modal - Always available -->
    <app-edit-event-modal
      [team]="team"
      [event]="editingEvent!"
      [isVisible]="!!editingEvent"
      (eventUpdated)="onEventUpdated($event)"
      (modalClosed)="onEditModalClosed()">
    </app-edit-event-modal>

    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Team Schedule</h2>
        <div class="flex gap-2">
          <!-- View Toggle -->
          <div class="flex rounded-md shadow-sm">
            <button
              (click)="viewType = 'list'"
              [class.bg-blue-600]="viewType === 'list'"
              [class.text-white]="viewType === 'list'"
              [class.bg-white]="viewType !== 'list'"
              [class.text-gray-700]="viewType !== 'list'"
              class="px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              List
            </button>
            <button
              (click)="viewType = 'calendar'"
              [class.bg-blue-600]="viewType === 'calendar'"
              [class.text-white]="viewType === 'calendar'"
              [class.bg-white]="viewType !== 'calendar'"
              [class.text-gray-700]="viewType !== 'calendar'"
              class="px-3 py-2 text-sm font-medium border-t border-r border-b border-gray-300 rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Calendar
            </button>
          </div>
          
          <button
            (click)="refreshSchedule()"
            [disabled]="loading"
            class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button
            *ngIf="canCreateEvents"
            (click)="openAddEventModal()"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            + Add Event
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- List View -->
      <div *ngIf="viewType === 'list'">

      <!-- Schedule Content -->
      <div *ngIf="!loading && events.length > 0" class="space-y-4">
        <!-- Filter Controls -->
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label for="viewMode" class="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              id="viewMode"
              [(ngModel)]="viewMode"
              (change)="onViewModeChange()"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="upcoming">Upcoming Events</option>
              <option value="all">All Events</option>
              <option value="past">Past Events</option>
            </select>
          </div>

          <div *ngIf="viewMode === 'all' || viewMode === 'past'">
            <label for="eventTypeFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              id="eventTypeFilter"
              [(ngModel)]="eventTypeFilter"
              (change)="filterEvents()"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Types</option>
              <option value="Practice">Practice</option>
              <option value="Game">Game</option>
              <option value="Scrimmage">Scrimmage</option>
              <option value="Tournament">Tournament</option>
            </select>
          </div>
        </div>

        <!-- Events List -->
        <div class="space-y-3">
          <div
            *ngFor="let event of filteredEvents"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            [class.bg-blue-50]="scheduleService.isEventToday(event.event_date)"
            [class.border-blue-300]="scheduleService.isEventToday(event.event_date)">
            
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">{{ scheduleService.getEventTypeIcon(event.event_type) }}</span>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ event.title }}</h3>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [class]="scheduleService.getEventTypeColor(event.event_type)">
                        {{ event.event_type }}
                      </span>
                      <span class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                        </svg>
                        <span *ngIf="event.end_date; else singleDate">
                          {{ scheduleService.formatEventDate(event.event_date) }} - {{ scheduleService.formatEventDate(event.end_date) }}
                        </span>
                        <ng-template #singleDate>
                          {{ scheduleService.formatEventDate(event.event_date) }}
                        </ng-template>
                      </span>
                      <span class="flex items-center" *ngIf="!event.end_date || (event.start_time && event.end_time)">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                        {{ scheduleService.formatEventTime(event.start_time, event.end_time) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Event Details -->
                <div class="space-y-1 text-sm text-gray-600">
                  <div *ngIf="event.location" class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    {{ event.location }}
                  </div>
                  <div *ngIf="event.opponent" class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                    vs {{ event.opponent }}
                  </div>
                  <div *ngIf="event.description" class="text-gray-700 mt-2">
                    {{ event.description }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div *ngIf="canCreateEvents" class="flex items-center gap-2 ml-4">
                <button
                  (click)="editEvent(event)"
                  class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit event">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button
                  (click)="deleteEvent(event)"
                  class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete event">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V7z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && events.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 8h4m-4 0H6a2 2 0 01-2-2V9a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No events scheduled</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating your first team event.</p>
        <div *ngIf="canCreateEvents" class="mt-6">
          <button
            (click)="openAddEventModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            Add Event
          </button>
        </div>
      </div>
      </div>

      <!-- Calendar View -->
      <div *ngIf="viewType === 'calendar'">
        <app-calendar
          [team]="team"
          [events]="events"
          [canCreateEvents]="canCreateEvents"
          (eventClicked)="onEventClicked($event)"
          (addEventClicked)="openAddEventModal()">
        </app-calendar>
      </div>
    </div>
  `,
  styles: []
})
export class ScheduleComponent implements OnInit, OnDestroy {
  @Input() team!: Team;
  @Input() canCreateEvents: boolean = false;

  events: ScheduleEvent[] = [];
  filteredEvents: ScheduleEvent[] = [];
  loading = false;
  error = '';
  
  viewMode: 'upcoming' | 'all' | 'past' = 'upcoming';
  viewType: 'list' | 'calendar' = 'list';
  eventTypeFilter = '';

  // For edit modal
  editingEvent: ScheduleEvent | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    public scheduleService: ScheduleService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    if (this.team?.id) {
      this.loadSchedule();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadSchedule(): void {
    if (!this.team?.id) return;
    
    this.loading = true;
    this.error = '';

    const subscription = this.scheduleService.getTeamSchedule(this.team.id).subscribe({
      next: (events) => {
        this.events = events;
        this.filterEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
        this.error = 'Failed to load team schedule';
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  refreshSchedule(): void {
    this.loadSchedule();
  }

  onViewModeChange(): void {
    this.eventTypeFilter = '';
    this.filterEvents();
  }

  onEventClicked(event: ScheduleEvent): void {
    // Enable editing if user can create events, otherwise just show event details
    if (this.canCreateEvents) {
      this.editEvent(event);
    } else {
      // Switch to list view and show event details
      this.viewType = 'list';
      console.log('Event clicked:', event);
    }
  }

  filterEvents(): void {
    let filtered = [...this.events];

    // Filter by view mode
    const now = new Date();
    switch (this.viewMode) {
      case 'upcoming':
        filtered = filtered.filter(event => 
          this.scheduleService.isEventUpcoming(event.event_date)
        );
        break;
      case 'past':
        filtered = filtered.filter(event => 
          !this.scheduleService.isEventUpcoming(event.event_date)
        );
        break;
      // 'all' shows everything
    }

    // Filter by event type
    if (this.eventTypeFilter) {
      filtered = filtered.filter(event => event.event_type === this.eventTypeFilter);
    }

    this.filteredEvents = filtered;
  }

  editEvent(event: ScheduleEvent): void {
    this.editingEvent = event;
    // No need to call modal service since we're using direct visibility control
  }

  openAddEventModal(): void {
    this.modalService.open({
      title: 'Add New Event',
      size: 'lg'
    });
  }

  onEventCreated(event: ScheduleEvent): void {
    this.events.push(event);
    this.filterEvents();
  }

  onEventUpdated(updatedEvent: ScheduleEvent): void {
    const index = this.events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      this.events[index] = updatedEvent;
      this.filterEvents();
    }
    this.editingEvent = null;
  }

  onEditModalClosed(): void {
    this.editingEvent = null;
  }

  deleteEvent(event: ScheduleEvent): void {
    if (!event.id || !confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

    const subscription = this.scheduleService.deleteEvent(event.id).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== event.id);
        this.filterEvents();
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.error = 'Failed to delete event';
      }
    });

    this.subscriptions.push(subscription);
  }
}
