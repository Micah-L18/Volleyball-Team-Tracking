import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig {
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private configSubject = new BehaviorSubject<ModalConfig | null>(null);

  public isOpen$ = this.isOpenSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  open(config: ModalConfig): void {
    this.configSubject.next(config);
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
    setTimeout(() => {
      this.configSubject.next(null);
    }, 300); // Wait for animation to complete
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
