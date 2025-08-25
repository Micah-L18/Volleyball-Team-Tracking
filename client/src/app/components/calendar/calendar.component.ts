import { Component, Input, OnInit, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ScheduleService, ScheduleEvent } from '../../services/schedule.service';
import { Team } from '../../models/types';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduleEvent[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md">
      <!-- Calendar Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          (click)="previousMonth()"
          class="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ currentDate | date:'MMMM yyyy' }}
          </h2>
          
          <button
            *ngIf="canCreateEvents"
            (click)="addEventClicked.emit()"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            Add Event
          </button>
        </div>
        
        <button
          (click)="nextMonth()"
          class="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="p-4">
        <!-- Day Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div
            *ngFor="let day of dayHeaders"
            class="p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            {{ day }}
          </div>
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          <div
            *ngFor="let day of calendarDays"
            class="min-h-24 p-1 border border-gray-100 rounded-md"
            [class.bg-gray-50]="!day.isCurrentMonth"
            [class.bg-blue-50]="day.isToday"
            [class.border-blue-300]="day.isToday">
            
            <!-- Day Number -->
            <div class="flex justify-between items-start mb-1">
              <span
                class="text-sm font-medium"
                [class.text-gray-400]="!day.isCurrentMonth"
                [class.text-blue-600]="day.isToday"
                [class.text-gray-900]="day.isCurrentMonth && !day.isToday">
                {{ day.day }}
              </span>
            </div>

            <!-- Events -->
            <div class="space-y-1">
              <div
                *ngFor="let event of day.events.slice(0, 3)"
                (click)="eventClicked.emit(event)"
                class="text-xs p-1 rounded cursor-pointer truncate"
                [class]="getEventClasses(event)"
                [title]="event.title + (event.start_time ? ' at ' + scheduleService.formatEventTime(event.start_time, event.end_time) : '')">
                {{ event.title }}
              </div>
              
              <!-- More events indicator -->
              <div
                *ngIf="day.events.length > 3"
                class="text-xs text-gray-500 font-medium pl-1">
                +{{ day.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CalendarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() team!: Team;
  @Input() events: ScheduleEvent[] = [];
  @Input() canCreateEvents: boolean = false;
  @Output() eventClicked = new EventEmitter<ScheduleEvent>();
  @Output() addEventClicked = new EventEmitter<void>();

  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private subscriptions: Subscription[] = [];

  constructor(public scheduleService: ScheduleService) {}

  ngOnInit(): void {
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(): void {
    this.generateCalendar();
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  private generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday before the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Generate 42 days (6 weeks)
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = this.getEventsForDate(date);
      
      this.calendarDays.push({
        date: new Date(date),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents
      });
    }
  }

  private getEventsForDate(date: Date): ScheduleEvent[] {
    const dateString = date.toISOString().split('T')[0];
    
    return this.events.filter(event => {
      // Single day event - normalize both dates for comparison
      const eventDateString = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : null;
      if (eventDateString === dateString) {
        return true;
      }
      
      // Multi-day event (tournaments)
      if (event.end_date) {
        const eventStart = new Date(event.event_date);
        const eventEnd = new Date(event.end_date);
        const checkDate = new Date(date);
        
        // Normalize to start of day for comparison
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);
        checkDate.setHours(12, 0, 0, 0); // Use noon to avoid timezone issues
        
        return checkDate >= eventStart && checkDate <= eventEnd;
      }
      
      return false;
    });
  }

  getEventClasses(event: ScheduleEvent): string {
    const baseClasses = 'hover:opacity-80 transition-opacity';
    
    switch (event.event_type) {
      case 'Practice':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'Game':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'Scrimmage':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'Tournament':
        return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  }
}
