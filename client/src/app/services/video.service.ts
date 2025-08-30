import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface VideoAttachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by: number;
}

export interface NoteVideo {
  id: number;
  player_id: number;
  video_id: number;
  note_type: string;
  reference_id: number;
  description: string;
  created_at: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  uploading: boolean;
  completed: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = `${environment.apiUrl}/videos`;
  private uploadProgressSubject = new BehaviorSubject<UploadProgress[]>([]);
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Upload a video file with progress tracking
   */
  uploadVideo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
    });

    // Add to upload progress tracking
    const uploads = this.uploadProgressSubject.value;
    const newUpload: UploadProgress = {
      file,
      progress: 0,
      uploading: true,
      completed: false
    };
    uploads.push(newUpload);
    this.uploadProgressSubject.next([...uploads]);

    return this.http.request(req).pipe(
      map(event => {
        const currentUploads = this.uploadProgressSubject.value;
        const uploadIndex = currentUploads.findIndex(u => u.file === file);
        
        if (uploadIndex !== -1) {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              if (event.total) {
                currentUploads[uploadIndex].progress = Math.round(100 * event.loaded / event.total);
              }
              break;
            case HttpEventType.Response:
              currentUploads[uploadIndex].uploading = false;
              currentUploads[uploadIndex].completed = true;
              currentUploads[uploadIndex].progress = 100;
              break;
          }
          this.uploadProgressSubject.next([...currentUploads]);
        }
        
        return event;
      })
    );
  }

  /**
   * Attach video to a note
   */
  attachVideoToNote(data: {
    player_id: number;
    video_id: number;
    note_type: string;
    reference_id: number;
    description?: string;
  }): Observable<NoteVideo> {
    return this.http.post<NoteVideo>(`${this.apiUrl}/attach`, data);
  }

  /**
   * Get videos for a specific player
   */
  getPlayerVideos(playerId: number): Observable<NoteVideo[]> {
    return this.http.get<NoteVideo[]>(`${this.apiUrl}/player/${playerId}`);
  }

  /**
   * Get all videos for the team
   */
  getTeamVideos(): Observable<VideoAttachment[]> {
    return this.http.get<VideoAttachment[]>(`${this.apiUrl}/team`);
  }

  /**
   * Get video stream URL
   */
  getVideoStreamUrl(videoId: number): string {
    return `${this.apiUrl}/stream/${videoId}`;
  }

  /**
   * Clear completed uploads
   */
  clearCompletedUploads(): void {
    const uploads = this.uploadProgressSubject.value.filter(u => !u.completed);
    this.uploadProgressSubject.next(uploads);
  }

  /**
   * Clear all uploads
   */
  clearAllUploads(): void {
    this.uploadProgressSubject.next([]);
  }

  /**
   * Remove specific upload from tracking
   */
  removeUpload(file: File): void {
    const uploads = this.uploadProgressSubject.value.filter(u => u.file !== file);
    this.uploadProgressSubject.next(uploads);
  }
}
