import { Component, Input, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../services/video.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-player-container" [class.fullscreen]="isFullscreen">
      <div class="video-wrapper">
        <video 
          #videoElement
          [src]="videoUrl"
          [poster]="posterUrl"
          [controls]="showControls"
          [autoplay]="autoplay"
          [muted]="muted"
          [loop]="loop"
          class="video-element"
          (loadedmetadata)="onVideoLoaded()"
          (timeupdate)="onTimeUpdate()"
          (ended)="onVideoEnded()"
          (error)="onVideoError($event)"
        >
          Your browser does not support the video tag.
        </video>

        <!-- Custom Controls Overlay -->
        <div class="video-controls" *ngIf="!showControls && !hideCustomControls" [class.visible]="showCustomControls">
          <div class="controls-background"></div>
          
          <!-- Play/Pause Button -->
          <button 
            class="control-btn play-pause-btn" 
            (click)="togglePlayPause()"
            [attr.aria-label]="isPlaying ? 'Pause video' : 'Play video'"
          >
            <svg *ngIf="!isPlaying" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg *ngIf="isPlaying" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <!-- Progress Bar -->
          <div class="progress-container">
            <div class="progress-bar" (click)="seekTo($event)">
              <div class="progress-filled" [style.width.%]="progress"></div>
              <div class="progress-handle" [style.left.%]="progress"></div>
            </div>
            <div class="time-display">
              <span class="current-time">{{ formatTime(currentTime) }}</span>
              <span class="separator">/</span>
              <span class="duration">{{ formatTime(duration) }}</span>
            </div>
          </div>

          <!-- Volume Control -->
          <div class="volume-control">
            <button class="control-btn volume-btn" (click)="toggleMute()">
              <svg *ngIf="!isMuted && volume > 0.5" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <svg *ngIf="!isMuted && volume <= 0.5 && volume > 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm10.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <svg *ngIf="isMuted || volume === 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            </button>
            <div class="volume-slider" *ngIf="showVolumeSlider">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                [value]="volume" 
                (input)="setVolume($event)"
                class="volume-range"
              >
            </div>
          </div>

          <!-- Fullscreen Button -->
          <button 
            class="control-btn fullscreen-btn" 
            (click)="toggleFullscreen()"
            [attr.aria-label]="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          >
            <svg *ngIf="!isFullscreen" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            <svg *ngIf="isFullscreen" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>
        </div>

        <!-- Loading Spinner -->
        <div class="loading-spinner" *ngIf="isLoading">
          <div class="spinner"></div>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="hasError">
          <div class="error-icon">⚠️</div>
          <p>Error loading video</p>
          <button class="retry-btn" (click)="retryLoad()">Retry</button>
        </div>
      </div>

      <!-- Video Info -->
      <div class="video-info" *ngIf="showInfo && videoInfo">
        <h3 class="video-title">{{ videoInfo.title }}</h3>
        <p class="video-description" *ngIf="videoInfo.description">{{ videoInfo.description }}</p>
        <div class="video-metadata">
          <span class="file-size">{{ formatFileSize(videoInfo.file_size) }}</span>
          <span class="upload-date">{{ videoInfo.uploaded_at | date:'short' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-player-container {
      position: relative;
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .video-player-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .video-element {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .video-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .video-controls.visible {
      opacity: 1;
    }

    .video-wrapper:hover .video-controls {
      opacity: 1;
    }

    .controls-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      pointer-events: none;
    }

    .control-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .play-pause-btn {
      padding: 0.75rem;
    }

    .progress-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 1;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    }

    .progress-filled {
      height: 100%;
      background: #3b82f6;
      border-radius: 3px;
      transition: width 0.1s ease;
    }

    .progress-handle {
      position: absolute;
      top: 50%;
      width: 12px;
      height: 12px;
      background: #3b82f6;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .progress-bar:hover .progress-handle {
      opacity: 1;
    }

    .time-display {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      font-family: monospace;
      min-width: 100px;
    }

    .volume-control {
      position: relative;
      display: flex;
      align-items: center;
      z-index: 1;
    }

    .volume-slider {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .volume-range {
      writing-mode: bt-lr; /* IE */
      -webkit-appearance: slider-vertical; /* WebKit */
      width: 30px;
      height: 80px;
    }

    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      z-index: 2;
    }

    .error-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .retry-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 0.5rem;
    }

    .retry-btn:hover {
      background: #2563eb;
    }

    .video-info {
      padding: 1rem;
      background: white;
      border-top: 1px solid #e5e7eb;
    }

    .video-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .video-description {
      margin: 0 0 0.75rem 0;
      color: #6b7280;
      line-height: 1.5;
    }

    .video-metadata {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #9ca3af;
    }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input() videoId!: number;
  @Input() videoInfo: any;
  @Input() autoplay = false;
  @Input() muted = false;
  @Input() loop = false;
  @Input() showControls = false;
  @Input() hideCustomControls = false;
  @Input() showInfo = true;
  @Input() posterUrl = '';

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  videoUrl = '';
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  volume = 1;
  isMuted = false;
  isFullscreen = false;
  isLoading = true;
  hasError = false;
  showCustomControls = false;
  showVolumeSlider = false;

  private controlsTimer: any;

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    if (this.videoId) {
      this.videoUrl = this.videoService.getVideoStreamUrl(this.videoId);
      this.isLoading = true;
    }
  }

  ngOnDestroy() {
    if (this.controlsTimer) {
      clearTimeout(this.controlsTimer);
    }
  }

  onVideoLoaded() {
    this.isLoading = false;
    this.hasError = false;
    if (this.videoElement) {
      this.duration = this.videoElement.nativeElement.duration;
      this.volume = this.videoElement.nativeElement.volume;
    }
  }

  onTimeUpdate() {
    if (this.videoElement) {
      this.currentTime = this.videoElement.nativeElement.currentTime;
      this.progress = (this.currentTime / this.duration) * 100;
    }
  }

  onVideoEnded() {
    this.isPlaying = false;
  }

  onVideoError(event: any) {
    this.isLoading = false;
    this.hasError = true;
    console.error('Video error:', event);
  }

  togglePlayPause() {
    if (this.videoElement) {
      if (this.isPlaying) {
        this.videoElement.nativeElement.pause();
      } else {
        this.videoElement.nativeElement.play();
      }
      this.isPlaying = !this.isPlaying;
    }
  }

  seekTo(event: MouseEvent) {
    if (this.videoElement) {
      const progressBar = event.currentTarget as HTMLElement;
      const rect = progressBar.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const newTime = percent * this.duration;
      this.videoElement.nativeElement.currentTime = newTime;
    }
  }

  toggleMute() {
    if (this.videoElement) {
      this.videoElement.nativeElement.muted = !this.videoElement.nativeElement.muted;
      this.isMuted = this.videoElement.nativeElement.muted;
    }
  }

  setVolume(event: any) {
    if (this.videoElement) {
      const volume = parseFloat(event.target.value);
      this.videoElement.nativeElement.volume = volume;
      this.volume = volume;
      this.isMuted = volume === 0;
    }
  }

  toggleFullscreen() {
    if (!this.isFullscreen) {
      if (this.videoElement.nativeElement.requestFullscreen) {
        this.videoElement.nativeElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.isFullscreen = !this.isFullscreen;
  }

  retryLoad() {
    this.hasError = false;
    this.isLoading = true;
    if (this.videoElement) {
      this.videoElement.nativeElement.load();
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
