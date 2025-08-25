import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService, ModalConfig } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-50 overflow-y-auto"
      (click)="onBackdropClick($event)">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
           [class.opacity-100]="isOpen"
           [class.opacity-0]="!isOpen"></div>
      
      <!-- Modal Container -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div 
          class="relative w-full transform rounded-lg bg-white shadow-xl transition-all"
          [class]="getModalSizeClass()"
          (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              {{ config?.title || 'Modal' }}
            </h3>
            <button
              *ngIf="config?.closable !== false"
              type="button"
              (click)="close()"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Modal Content -->
          <div class="p-6">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModalComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  config: ModalConfig | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    const isOpenSub = this.modalService.isOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
    });

    const configSub = this.modalService.config$.subscribe(config => {
      this.config = config;
    });

    this.subscriptions.push(isOpenSub, configSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  close(): void {
    this.modalService.close();
    this.closed.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget && this.config?.closable !== false) {
      this.close();
    }
  }

  getModalSizeClass(): string {
    switch (this.config?.size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-lg';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      default: return 'max-w-2xl';
    }
  }
}
