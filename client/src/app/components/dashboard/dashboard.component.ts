import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center">
                <span class="text-2xl">🏐</span>
                <h1 class="ml-2 text-xl font-bold text-gray-900">Volleyball Coach</h1>
              </div>
              <div class="hidden md:ml-10 md:flex md:space-x-8">
                <a routerLink="/dashboard" 
                   class="text-volleyball-orange border-volleyball-orange border-b-2 px-1 pt-1 pb-4 text-sm font-medium"
                   routerLinkActive="text-volleyball-orange border-volleyball-orange border-b-2">
                  Dashboard
                </a>
                <a routerLink="/teams" 
                   class="text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 pt-1 pb-4 border-b-2 border-transparent text-sm font-medium"
                   routerLinkActive="text-volleyball-orange border-volleyball-orange border-b-2">
                  Teams
                </a>
                <a routerLink="/players" 
                   class="text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 pt-1 pb-4 border-b-2 border-transparent text-sm font-medium"
                   routerLinkActive="text-volleyball-orange border-volleyball-orange border-b-2">
                  Players
                </a>
              </div>
            </div>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <button
                  (click)="logout()"
                  class="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-volleyball-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-volleyball-orange"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p class="mt-1 text-sm text-gray-600">
              Here's what's happening with your volleyball teams today.
            </p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-volleyball-orange rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">👥</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Teams</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ stats.totalTeams }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-volleyball-blue rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">🏃</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Players</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ stats.totalPlayers }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">📈</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active Drills</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ stats.activeDrills }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">📅</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ stats.upcomingEvents }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button class="btn-primary">
                  <span class="mr-2">🏐</span>
                  Add New Team
                </button>
                <button class="btn-secondary">
                  <span class="mr-2">👤</span>
                  Add Player
                </button>
                <button class="btn-secondary">
                  <span class="mr-2">📊</span>
                  View Statistics
                </button>
                <button class="btn-secondary">
                  <span class="mr-2">📹</span>
                  Upload Video
                </button>
                <button class="btn-secondary">
                  <span class="mr-2">📝</span>
                  Create Drill
                </button>
                <button class="btn-secondary">
                  <span class="mr-2">📅</span>
                  Schedule Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class DashboardComponent {
  stats = {
    totalTeams: 0,
    totalPlayers: 0,
    activeDrills: 0,
    upcomingEvents: 0
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize with placeholder data
    this.stats = {
      totalTeams: 3,
      totalPlayers: 45,
      activeDrills: 12,
      upcomingEvents: 8
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
