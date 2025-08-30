import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService, UploadProgress } from '../../services/video.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="video-upload-container">
      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.dragover]="isDragOver"
        [class.disabled]="disabled"
        (click)="!disabled && fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <input 
          #fileInput
          type="file"
          accept="video/*"
          multiple
          class="hidden"
          (change)="onFileSelect($event)"
          [disabled]="disabled"
        >
        
        <div class="upload-content">
          <div class="upload-icon">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <h3 class="upload-title">Upload Video Files</h3>
          <p class="upload-description">
            Drag and drop video files here, or click to select files
          </p>
          <p class="upload-info">
            Supports MP4, MOV, AVI, WebM files up to 100MB
          </p>
          <button 
            type="button" 
            class="upload-button"
            [disabled]="disabled"
          >
            <span class="button-icon">📹</span>
            Select Videos
          </button>
        </div>
      </div>

      <!-- Upload Progress -->
      <div class="upload-progress-section" *ngIf="(uploadProgress$ | async)?.length">
        <h4 class="progress-title">Upload Progress</h4>
        <div class="progress-list">
          <div 
            *ngFor="let upload of uploadProgress$ | async; trackBy: trackByFile"
            class="progress-item"
            [class.completed]="upload.completed"
            [class.error]="upload.error"
          >
            <div class="file-info">
              <div class="file-icon">🎬</div>
              <div class="file-details">
                <div class="file-name">{{ upload.file.name }}</div>
                <div class="file-size">{{ formatFileSize(upload.file.size) }}</div>
              </div>
            </div>
            
            <div class="progress-details">
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    [style.width.%]="upload.progress"
                    [class.completed]="upload.completed"
                    [class.error]="upload.error"
                  ></div>
                </div>
                <div class="progress-text">
                  <span *ngIf="upload.uploading">{{ upload.progress }}%</span>
                  <span *ngIf="upload.completed" class="text-green-600">✓ Complete</span>
                  <span *ngIf="upload.error" class="text-red-600">✗ Error</span>
                </div>
              </div>
              
              <button 
                *ngIf="upload.completed || upload.error"
                class="remove-btn"
                (click)="removeUpload(upload.file)"
                title="Remove from list"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        
        <div class="progress-actions">
          <button 
            class="clear-btn"
            (click)="clearCompleted()"
            type="button"
          >
            Clear Completed
          </button>
          <button 
            class="clear-all-btn"
            (click)="clearAll()"
            type="button"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Recently Uploaded -->
      <div class="recent-uploads" *ngIf="recentUploads.length > 0">
        <h4 class="recent-title">Recently Uploaded</h4>
        <div class="recent-list">
          <div 
            *ngFor="let video of recentUploads; trackBy: trackByVideoId"
            class="recent-item"
            (click)="selectVideo(video)"
          >
            <div class="video-thumbnail">
              <div class="thumbnail-placeholder">🎬</div>
            </div>
            <div class="video-info">
              <div class="video-name">{{ video.file_name }}</div>
              <div class="video-meta">
                <span class="video-size">{{ formatFileSize(video.file_size) }}</span>
                <span class="video-date">{{ video.uploaded_at | date:'short' }}</span>
              </div>
            </div>
            <button 
              class="select-btn"
              (click)="$event.stopPropagation(); selectVideo(video)"
              type="button"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-upload-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .upload-area:hover:not(.disabled) {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .upload-area.dragover {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: scale(1.02);
    }

    .upload-area.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .hidden {
      display: none;
    }

    .upload-content {
      pointer-events: none;
    }

    .upload-icon {
      margin: 0 auto 1rem;
      color: #9ca3af;
    }

    .upload-title {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .upload-description {
      margin: 0 0 0.5rem;
      color: #6b7280;
      font-size: 1rem;
    }

    .upload-info {
      margin: 0 0 1.5rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .upload-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      pointer-events: all;
    }

    .upload-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .upload-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .button-icon {
      font-size: 1.125rem;
    }

    .upload-progress-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }

    .progress-title {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .progress-list {
      space-y: 1rem;
    }

    .progress-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .progress-item.completed {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .progress-item.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 200px;
    }

    .file-icon {
      font-size: 1.5rem;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.875rem;
      word-break: break-word;
    }

    .file-size {
      color: #6b7280;
      font-size: 0.75rem;
    }

    .progress-details {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar-container {
      flex: 1;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-fill.completed {
      background: #10b981;
    }

    .progress-fill.error {
      background: #ef4444;
    }

    .progress-text {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      text-align: center;
    }

    .remove-btn {
      background: #f3f4f6;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .progress-actions {
      margin-top: 1rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .clear-btn, .clear-all-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #374151;
    }

    .clear-btn:hover, .clear-all-btn:hover {
      background: #f9fafb;
    }

    .recent-uploads {
      margin-top: 2rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }

    .recent-title {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .recent-list {
      space-y: 0.75rem;
    }

    .recent-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-bottom: 0.75rem;
    }

    .recent-item:hover {
      background: #f3f4f6;
    }

    .video-thumbnail {
      width: 48px;
      height: 48px;
      background: #e5e7eb;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .thumbnail-placeholder {
      font-size: 1.25rem;
      color: #6b7280;
    }

    .video-info {
      flex: 1;
    }

    .video-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .video-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .select-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .select-btn:hover {
      background: #2563eb;
    }

    .text-green-600 {
      color: #059669;
    }

    .text-red-600 {
      color: #dc2626;
    }
  `]
})
export class VideoUploadComponent {
  @Input() disabled = false;
  @Input() recentUploads: any[] = [];
  @Output() videoUploaded = new EventEmitter<any>();
  @Output() videoSelected = new EventEmitter<any>();

  isDragOver = false;
  uploadProgress$: Observable<UploadProgress[]>;

  constructor(private videoService: VideoService) {
    this.uploadProgress$ = this.videoService.uploadProgress$;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.handleFiles(files);
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files || []) as File[];
    this.handleFiles(files);
    
    // Reset input
    event.target.value = '';
  }

  private handleFiles(files: File[]) {
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      alert('Please select valid video files.');
      return;
    }

    videoFiles.forEach(file => {
      this.uploadVideo(file);
    });
  }

  private uploadVideo(file: File) {
    this.videoService.uploadVideo(file).subscribe({
      next: (event: any) => {
        if (event.type === 4) { // HttpEventType.Response
          this.videoUploaded.emit(event.body.video);
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        // Error handling would need to be implemented differently
        // since we can't directly access the BehaviorSubject value
      }
    });
  }

  selectVideo(video: any) {
    this.videoSelected.emit(video);
  }

  removeUpload(file: File) {
    this.videoService.removeUpload(file);
  }

  clearCompleted() {
    this.videoService.clearCompletedUploads();
  }

  clearAll() {
    this.videoService.clearAllUploads();
  }

  trackByFile(index: number, upload: UploadProgress): any {
    return upload.file.name + upload.file.size;
  }

  trackByVideoId(index: number, video: any): any {
    return video.id;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
