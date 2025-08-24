import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Main dashboard content without navigation -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
