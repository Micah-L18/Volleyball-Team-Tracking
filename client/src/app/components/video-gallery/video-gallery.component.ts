import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService, VideoAttachment, NoteVideo } from '../../services/video.service';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { VideoUploadComponent } from '../video-upload/video-upload.component';

@Component({
  selector: 'app-video-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, VideoPlayerComponent, VideoUploadComponent],
  template: `
    <div class="video-gallery-container">
      <div class="gallery-header">
        <h2 class="gallery-title">Video Gallery</h2>
        <div class="gallery-controls">
          <button 
            class="control-btn"
            [class.active]="currentView === 'grid'"
            (click)="currentView = 'grid'"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            Grid
          </button>
          <button 
            class="control-btn"
            [class.active]="currentView === 'list'"
            (click)="currentView = 'list'"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            List
          </button>
          <button 
            class="upload-btn"
            (click)="showUploadModal = true"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Upload Videos
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="filters-section">
        <div class="search-box">
          <svg class="search-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search videos..." 
            [(ngModel)]="searchTerm"
            (input)="filterVideos()"
            class="search-input"
          >
        </div>
        <div class="filter-controls">
          <select [(ngModel)]="sortBy" (change)="sortVideos()" class="sort-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="size">File Size</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading videos...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredVideos.length === 0">
        <div class="empty-icon">🎬</div>
        <h3>No videos found</h3>
        <p *ngIf="searchTerm">Try adjusting your search terms</p>
        <p *ngIf="!searchTerm">Upload your first video to get started</p>
        <button 
          class="upload-btn primary"
          (click)="showUploadModal = true"
        >
          Upload Videos
        </button>
      </div>

      <!-- Grid View -->
      <div class="video-grid" *ngIf="!isLoading && currentView === 'grid' && filteredVideos.length > 0">
        <div 
          *ngFor="let video of filteredVideos; trackBy: trackByVideoId"
          class="video-card"
          (click)="selectVideo(video)"
          [class.selected]="selectedVideo?.id === video.id"
        >
          <div class="video-thumbnail">
            <div class="thumbnail-placeholder">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div class="video-info">
            <h4 class="video-title">{{ video.file_name }}</h4>
            <div class="video-meta">
              <span class="file-size">{{ formatFileSize(video.file_size) }}</span>
              <span class="upload-date">{{ video.uploaded_at | date:'short' }}</span>
            </div>
          </div>
          <div class="video-actions">
            <button 
              class="action-btn play"
              (click)="$event.stopPropagation(); playVideo(video)"
              title="Play video"
            >
              ▶️
            </button>
            <button 
              class="action-btn download"
              (click)="$event.stopPropagation(); downloadVideo(video)"
              title="Download video"
            >
              💾
            </button>
            <button 
              class="action-btn delete"
              (click)="$event.stopPropagation(); deleteVideo(video)"
              title="Delete video"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div class="video-list" *ngIf="!isLoading && currentView === 'list' && filteredVideos.length > 0">
        <div class="list-header">
          <div class="col-name">Name</div>
          <div class="col-size">Size</div>
          <div class="col-date">Upload Date</div>
          <div class="col-actions">Actions</div>
        </div>
        <div 
          *ngFor="let video of filteredVideos; trackBy: trackByVideoId"
          class="list-item"
          (click)="selectVideo(video)"
          [class.selected]="selectedVideo?.id === video.id"
        >
          <div class="col-name">
            <div class="file-icon">🎬</div>
            <div class="file-details">
              <div class="file-name">{{ video.file_name }}</div>
              <div class="file-type">{{ video.mime_type }}</div>
            </div>
          </div>
          <div class="col-size">{{ formatFileSize(video.file_size) }}</div>
          <div class="col-date">{{ video.uploaded_at | date:'short' }}</div>
          <div class="col-actions">
            <button 
              class="action-btn play"
              (click)="$event.stopPropagation(); playVideo(video)"
              title="Play video"
            >
              ▶️
            </button>
            <button 
              class="action-btn download"
              (click)="$event.stopPropagation(); downloadVideo(video)"
              title="Download video"
            >
              💾
            </button>
            <button 
              class="action-btn delete"
              (click)="$event.stopPropagation(); deleteVideo(video)"
              title="Delete video"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Video Player Modal -->
      <div class="modal-overlay" *ngIf="showVideoPlayer" (click)="closeVideoPlayer()">
        <div class="video-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedVideo?.file_name }}</h3>
            <button class="close-btn" (click)="closeVideoPlayer()">×</button>
          </div>
          <div class="modal-body">
            <app-video-player
              *ngIf="selectedVideo"
              [videoId]="selectedVideo.id"
              [videoInfo]="selectedVideo"
              [showInfo]="false"
            ></app-video-player>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="modal-overlay" *ngIf="showUploadModal" (click)="closeUploadModal()">
        <div class="upload-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Upload Videos</h3>
            <button class="close-btn" (click)="closeUploadModal()">×</button>
          </div>
          <div class="modal-body">
            <app-video-upload
              [recentUploads]="videos.slice(0, 5)"
              (videoUploaded)="onVideoUploaded($event)"
              (videoSelected)="onVideoSelected($event)"
            ></app-video-upload>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-gallery-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .gallery-title {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #1f2937;
    }

    .gallery-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #374151;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: #f9fafb;
    }

    .control-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .upload-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .upload-btn:hover {
      background: #059669;
    }

    .upload-btn.primary {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }

    .filter-controls {
      display: flex;
      gap: 0.5rem;
    }

    .sort-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .video-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .video-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .video-card.selected {
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }

    .video-thumbnail {
      position: relative;
      aspect-ratio: 16/9;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .thumbnail-placeholder {
      color: #9ca3af;
    }

    .video-duration {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
    }

    .video-info {
      padding: 1rem;
    }

    .video-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      word-break: break-word;
    }

    .video-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .video-actions {
      padding: 0.75rem 1rem;
      border-top: 1px solid #f3f4f6;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .action-btn {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .action-btn:hover {
      background: #f3f4f6;
    }

    .video-list {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-header {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
    }

    .list-item {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.2s ease;
      align-items: center;
    }

    .list-item:hover {
      background: #f9fafb;
    }

    .list-item.selected {
      background: #eff6ff;
      border-color: #3b82f6;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .col-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-icon {
      font-size: 1.25rem;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .file-type {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .col-size, .col-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .col-actions {
      display: flex;
      gap: 0.5rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .video-modal {
      background: white;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      width: 800px;
      overflow: hidden;
    }

    .upload-modal {
      background: white;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      width: 600px;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f3f4f6;
    }

    .modal-body {
      padding: 1.5rem;
    }
  `]
})
export class VideoGalleryComponent implements OnInit {
  videos: VideoAttachment[] = [];
  filteredVideos: VideoAttachment[] = [];
  selectedVideo: VideoAttachment | null = null;
  
  currentView: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'newest';
  
  isLoading = false;
  showVideoPlayer = false;
  showUploadModal = false;

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    this.loadVideos();
  }

  loadVideos() {
    this.isLoading = true;
    this.videoService.getTeamVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.filterVideos();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.isLoading = false;
      }
    });
  }

  filterVideos() {
    let filtered = [...this.videos];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(video => 
        video.file_name.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        case 'oldest':
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        default:
          return 0;
      }
    });

    this.filteredVideos = filtered;
  }

  sortVideos() {
    this.filterVideos();
  }

  selectVideo(video: VideoAttachment) {
    this.selectedVideo = video;
  }

  playVideo(video: VideoAttachment) {
    this.selectedVideo = video;
    this.showVideoPlayer = true;
  }

  downloadVideo(video: VideoAttachment) {
    const url = this.videoService.getVideoStreamUrl(video.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = video.file_name;
    link.click();
  }

  deleteVideo(video: VideoAttachment) {
    if (confirm(`Are you sure you want to delete "${video.file_name}"?`)) {
      // TODO: Implement delete video endpoint
      console.log('Delete video:', video.id);
    }
  }

  closeVideoPlayer() {
    this.showVideoPlayer = false;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onVideoUploaded(video: VideoAttachment) {
    this.videos.unshift(video);
    this.filterVideos();
    this.closeUploadModal();
  }

  onVideoSelected(video: VideoAttachment) {
    this.selectVideo(video);
    this.closeUploadModal();
  }

  trackByVideoId(index: number, video: VideoAttachment): number {
    return video.id;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
