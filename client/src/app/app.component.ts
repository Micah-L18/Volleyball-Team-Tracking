import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'volleyball-coach-client';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  shouldShowNavigation(): boolean {
    // Don't show navigation on login/register pages
    const currentUrl = this.router.url;
    return !currentUrl.includes('/login') && 
           !currentUrl.includes('/register') && 
           this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
