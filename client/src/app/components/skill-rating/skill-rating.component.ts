import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SkillRatingService, VolleyballSkill, SkillRating } from '../../services/skill-rating.service';
import { Player } from '../../interfaces/player.interface';

@Component({
  selector: 'app-skill-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900">
          Skill Ratings - {{ player.name }}
        </h3>
        <div class="flex gap-2">
          <button
            (click)="toggleViewMode()"
            class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {{ viewMode === 'category' ? 'List View' : 'Category View' }}
          </button>
          <button
            (click)="openBulkRatingModal()"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Bulk Rate
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Player Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" *ngIf="!loading">
        <div class="bg-blue-50 rounded-lg p-4">
          <div class="text-lg font-semibold text-blue-900">Overall Average</div>
          <div class="text-2xl font-bold text-blue-600">{{ getOverallAverage() }}</div>
          <div class="text-sm text-blue-700">{{ getRatedSkillsCount() }} skills rated</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4">
          <div class="text-lg font-semibold text-green-900">Highest Rating</div>
          <div class="text-2xl font-bold text-green-600">{{ getHighestRating() }}</div>
          <div class="text-sm text-green-700">{{ getHighestSkill() }}</div>
        </div>
        <div class="bg-yellow-50 rounded-lg p-4">
          <div class="text-lg font-semibold text-yellow-900">Categories Rated</div>
          <div class="text-2xl font-bold text-yellow-600">{{ getCategoriesRatedCount() }}</div>
          <div class="text-sm text-yellow-700">of {{ getTotalCategoriesCount() }} total</div>
        </div>
      </div>

      <!-- Category View -->
      <div *ngIf="viewMode === 'category' && !loading" class="space-y-6">
        <!-- Category Sort Controls -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">Sort within categories:</h3>
            <div class="flex gap-2">
              <button 
                (click)="sortCategoryView('name')"
                class="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                [class.bg-blue-50]="categorySortField === 'name'"
                [class.border-blue-200]="categorySortField === 'name'">
                Name {{ getSortIcon('name', true) }}
              </button>
              <button 
                (click)="sortCategoryView('rating')"
                class="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                [class.bg-blue-50]="categorySortField === 'rating'"
                [class.border-blue-200]="categorySortField === 'rating'">
                Rating {{ getSortIcon('rating', true) }}
              </button>
            </div>
          </div>
        </div>

        <div *ngFor="let category of getCategories()" class="border border-gray-200 rounded-lg">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 class="font-medium text-gray-900">{{ category }}</h4>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Avg: {{ getCategoryAverage(category) }}</span>
              <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                {{ getCategoryRatedCount(category) }}/{{ getCategorySkillCount(category) }}
              </span>
            </div>
          </div>
          <div class="p-4 space-y-3">
            <div *ngFor="let skill of getSortedSkillsByCategory(category)" 
                 class="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ skill.name }}</div>
                <div class="text-sm text-gray-500">{{ skill.description }}</div>
              </div>
              <div class="flex items-center gap-4">
                <!-- Star Rating Display -->
                <div class="flex items-center gap-1 select-none">
                  <div *ngFor="let star of [1,2,3,4,5]" 
                       class="cursor-pointer relative p-1"
                       (click)="handleStarClick(skill.name, star)"
                       title="Single click: {{ star }} stars, Double click: {{ star - 0.5 }} stars">
                    <!-- Full Star -->
                    <svg *ngIf="isStarFull(skill.name, star)" 
                         class="w-6 h-6 text-yellow-400" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <!-- Half Star -->
                    <div *ngIf="isStarHalf(skill.name, star)" class="relative w-6 h-6">
                      <!-- Empty star background -->
                      <svg class="w-6 h-6 text-gray-300 absolute" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <!-- Half filled star -->
                      <svg class="w-6 h-6 text-yellow-400 absolute" fill="currentColor" viewBox="0 0 20 20">
                        <defs>
                          <clipPath [attr.id]="getClipPathId(skill.name, star)">
                            <rect x="0" y="0" width="10" height="20"/>
                          </clipPath>
                        </defs>
                        <path [attr.clip-path]="getClipPathUrl(skill.name, star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <!-- Empty Star -->
                    <svg *ngIf="isStarEmpty(skill.name, star)" 
                         class="w-6 h-6 text-gray-300" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                </div>
                <!-- Numeric Rating - Separated to prevent selection -->
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium text-gray-700 w-12 select-none">
                    {{ formatRating(getCurrentRating(skill.name)) }}
                  </span>
                  <!-- Notes Indicator -->
                  <button *ngIf="hasNotes(skill.name)" 
                          (click)="showNotes(skill.name)"
                          class="text-blue-600 hover:text-blue-800">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div *ngIf="viewMode === 'list' && !loading" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  (click)="sortListView('name')">
                <div class="flex items-center space-x-1">
                  <span>Skill</span>
                  <span class="text-xs">{{ getSortIcon('name') }}</span>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  (click)="sortListView('category')">
                <div class="flex items-center space-x-1">
                  <span>Category</span>
                  <span class="text-xs">{{ getSortIcon('category') }}</span>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  (click)="sortListView('rating')">
                <div class="flex items-center space-x-1">
                  <span>Rating</span>
                  <span class="text-xs">{{ getSortIcon('rating') }}</span>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  (click)="sortListView('date')">
                <div class="flex items-center space-x-1">
                  <span>Last Rated</span>
                  <span class="text-xs">{{ getSortIcon('date') }}</span>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let skill of getSortedSkills()" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ skill.name }}</div>
                <div class="text-sm text-gray-500">{{ skill.description }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="getCategoryColorClass(skill.category)">
                  {{ skill.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-4">
                  <!-- Star Rating Display -->
                  <div class="flex items-center gap-1 select-none">
                    <div *ngFor="let star of [1,2,3,4,5]" 
                         class="cursor-pointer relative p-1"
                         (click)="handleStarClick(skill.name, star)"
                         title="Single click: {{ star }} stars, Double click: {{ star - 0.5 }} stars">
                      <!-- Full Star -->
                      <svg *ngIf="isStarFull(skill.name, star)" 
                           class="w-5 h-5 text-yellow-400" 
                           fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <!-- Half Star -->
                      <div *ngIf="isStarHalf(skill.name, star)" class="relative w-5 h-5">
                        <!-- Empty star background -->
                        <svg class="w-5 h-5 text-gray-300 absolute" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <!-- Half filled star -->
                        <svg class="w-5 h-5 text-yellow-400 absolute" fill="currentColor" viewBox="0 0 20 20">
                          <defs>
                            <clipPath [attr.id]="getClipPathId(skill.name, star, 'list')">
                              <rect x="0" y="0" width="10" height="20"/>
                            </clipPath>
                          </defs>
                          <path [attr.clip-path]="getClipPathUrl(skill.name, star, 'list')" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                      <!-- Empty Star -->
                      <svg *ngIf="isStarEmpty(skill.name, star)" 
                           class="w-5 h-5 text-gray-300" 
                           fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>
                  <!-- Numeric Rating - Separated -->
                  <span class="text-sm text-gray-700 select-none">{{ formatRating(getCurrentRating(skill.name)) || 'Not rated' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getLastRatedDate(skill.name) || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button *ngIf="hasNotes(skill.name)" 
                        (click)="showNotes(skill.name)"
                        class="text-blue-600 hover:text-blue-800">
                  View
                </button>
                <span *ngIf="!hasNotes(skill.name)">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bulk Rating Modal -->
    <div *ngIf="showBulkModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="closeBulkModal()">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Bulk Rate Skills</h3>
          <div class="max-h-96 overflow-y-auto space-y-2">
            <div *ngFor="let skill of allSkills" class="flex items-center justify-between p-2 border rounded">
              <span class="text-sm">{{ skill.name }}</span>
              <div class="flex items-center gap-4">
                <!-- Star Rating Display -->
                <div class="flex items-center gap-1 select-none">
                  <div *ngFor="let star of [1,2,3,4,5]" 
                       class="cursor-pointer relative p-1"
                       (click)="handleBulkStarClick(skill.name, star)"
                       title="Single click: {{ star }} stars, Double click: {{ star - 0.5 }} stars">
                    <!-- Full Star -->
                    <svg *ngIf="isBulkStarFull(skill.name, star)" 
                         class="w-5 h-5 text-yellow-400" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <!-- Half Star -->
                    <div *ngIf="isBulkStarHalf(skill.name, star)" class="relative w-5 h-5">
                      <!-- Empty star background -->
                      <svg class="w-5 h-5 text-gray-300 absolute" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <!-- Half filled star -->
                      <svg class="w-5 h-5 text-yellow-400 absolute" fill="currentColor" viewBox="0 0 20 20">
                        <defs>
                          <clipPath [attr.id]="getClipPathId(skill.name, star, 'bulk')">
                            <rect x="0" y="0" width="10" height="20"/>
                          </clipPath>
                        </defs>
                        <path [attr.clip-path]="getClipPathUrl(skill.name, star, 'bulk')" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <!-- Empty Star -->
                    <svg *ngIf="isBulkStarEmpty(skill.name, star)" 
                         class="w-5 h-5 text-gray-300" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                </div>
                <!-- Numeric Rating - Separated -->
                <span class="text-xs text-gray-600 w-8 select-none">{{ formatRating(getBulkRating(skill.name)) }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button
              (click)="closeBulkModal()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              (click)="submitBulkRating()"
              [disabled]="!hasBulkRatings()"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              Save Ratings
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SkillRatingComponent implements OnInit, OnDestroy, OnChanges {
  @Input() player!: Player;
  @Output() ratingsUpdated = new EventEmitter<void>();

  viewMode: 'category' | 'list' = 'category';
  loading = false;
  error = '';
  
  allSkills: VolleyballSkill[] = [];
  playerRatings: SkillRating[] = [];
  
  showBulkModal = false;
  bulkRatings: { [skillName: string]: number } = {};
  
  // Sorting properties
  sortField: 'name' | 'category' | 'rating' | 'date' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  categorySortField: 'name' | 'rating' = 'name';
  categorySortDirection: 'asc' | 'desc' = 'asc';
  
  // Half star rating properties
  private clickTimers: { [key: string]: any } = {};
  private clickCounts: { [key: string]: number } = {};
  private readonly DOUBLE_CLICK_DELAY = 300; // ms
  
  private subscriptions: Subscription[] = [];

  constructor(private skillRatingService: SkillRatingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['player'] && !changes['player'].firstChange) {
      // Player changed, reload data for new player
      this.loadPlayerData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';

    // Load skills (only once)
    const skillsSub = this.skillRatingService.getSkills().subscribe({
      next: (skills: VolleyballSkill[]) => {
        this.allSkills = skills;
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        console.error('Error loading skills:', error);
        this.error = 'Failed to load skills';
        this.loading = false;
      }
    });

    this.subscriptions.push(skillsSub);
    
    // Load player-specific data
    this.loadPlayerData();
  }

  private loadPlayerData(): void {
    // Clear local player ratings
    this.playerRatings = [];
    
    // Load player ratings for this specific player
    this.skillRatingService.getPlayerRatings(this.player.id).subscribe({
      next: (ratings: SkillRating[]) => {
        console.log('🎯 DEBUG: Player ratings received:', ratings);
        ratings.forEach(rating => {
          console.log(`📊 Rating: ${rating.skill_name} = ${rating.rating} (type: ${typeof rating.rating})`);
        });
        this.playerRatings = ratings;
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        console.error('Error loading player ratings:', error);
        this.error = 'Failed to load player ratings';
        this.loading = false;
      }
    });
  }

  private checkLoadingComplete(): void {
    if (this.allSkills.length > 0) {
      this.loading = false;
    }
  }

  // Sorting methods
  sortListView(field: 'name' | 'category' | 'rating' | 'date'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  sortCategoryView(field: 'name' | 'rating'): void {
    if (this.categorySortField === field) {
      this.categorySortDirection = this.categorySortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.categorySortField = field;
      this.categorySortDirection = 'asc';
    }
  }

  getSortedSkills(): VolleyballSkill[] {
    const sorted = [...this.allSkills].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'rating':
          aValue = this.getCurrentRating(a.name);
          bValue = this.getCurrentRating(b.name);
          break;
        case 'date':
          const aRating = this.playerRatings.find(r => r.skill_name === a.name);
          const bRating = this.playerRatings.find(r => r.skill_name === b.name);
          aValue = aRating ? new Date(aRating.rated_date).getTime() : 0;
          bValue = bRating ? new Date(bRating.rated_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }

  getSortedSkillsByCategory(category: string): VolleyballSkill[] {
    const categorySkills = this.allSkills.filter(skill => skill.category === category);
    
    return categorySkills.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.categorySortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = this.getCurrentRating(a.name);
          bValue = this.getCurrentRating(b.name);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.categorySortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.categorySortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(field: string, isCategory: boolean = false): string {
    const currentField = isCategory ? this.categorySortField : this.sortField;
    const currentDirection = isCategory ? this.categorySortDirection : this.sortDirection;
    
    if (currentField !== field) {
      return '↕️'; // unsorted
    }
    return currentDirection === 'asc' ? '↑' : '↓';
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'category' ? 'list' : 'category';
  }

  handleStarClick(skillName: string, starValue: number): void {
    const key = `${skillName}-${starValue}`;
    
    // Clear any existing timer for this star
    if (this.clickTimers[key]) {
      clearTimeout(this.clickTimers[key]);
    }
    
    // Initialize click count if not exists
    if (!this.clickCounts[key]) {
      this.clickCounts[key] = 0;
    }
    
    this.clickCounts[key]++;
    
    // Set a timer to handle the click(s)
    this.clickTimers[key] = setTimeout(() => {
      const clickCount = this.clickCounts[key];
      let finalRating: number;
      
      if (clickCount === 1) {
        // Single click - full star rating
        finalRating = starValue;
      } else {
        // Double click (or more) - half star rating
        finalRating = starValue - 0.5;
      }
      
      // Make sure rating is within valid range (0.5 to 5.0)
      finalRating = Math.max(0.5, Math.min(5.0, finalRating));
      
      this.updateRating(skillName, finalRating);
      
      // Reset click count
      this.clickCounts[key] = 0;
    }, this.DOUBLE_CLICK_DELAY);
  }

  updateRating(skillName: string, rating: number): void {
    this.skillRatingService.updateSkillRating(this.player.id, skillName, rating).subscribe({
      next: () => {
        // Reload player ratings to update averages immediately
        this.skillRatingService.getPlayerRatings(this.player.id).subscribe({
          next: (ratings: SkillRating[]) => {
            this.playerRatings = ratings;
          },
          error: (error: any) => {
            console.error('Error reloading ratings:', error);
          }
        });
        this.ratingsUpdated.emit();
      },
      error: (error) => {
        console.error('Error updating rating:', error);
        this.error = 'Failed to update rating';
      }
    });
  }

  getCurrentRating(skillName: string): number {
    const rating = this.playerRatings.find(r => r.skill_name === skillName);
    const result = rating ? rating.rating : 0;
    console.log(`🔍 getCurrentRating(${skillName}): found=${!!rating}, rating=${result}, type=${typeof result}`);
    return result;
  }

  // Half star display methods
  isStarFull(skillName: string, starPosition: number): boolean {
    const rating = this.getCurrentRating(skillName);
    return rating >= starPosition;
  }

  isStarHalf(skillName: string, starPosition: number): boolean {
    const rating = this.getCurrentRating(skillName);
    return rating >= (starPosition - 0.5) && rating < starPosition;
  }

  isStarEmpty(skillName: string, starPosition: number): boolean {
    const rating = this.getCurrentRating(skillName);
    return rating < (starPosition - 0.5);
  }

  formatRating(rating: number): string {
    if (rating === 0) return '-';
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  }

  // Helper methods for clipPath IDs (sanitize skill names for valid CSS IDs)
  getClipPathId(skillName: string, star: number, context: string = 'category'): string {
    const sanitizedName = skillName.replace(/[^a-zA-Z0-9]/g, '_');
    return `half-${context}-${sanitizedName}-${star}`;
  }

  getClipPathUrl(skillName: string, star: number, context: string = 'category'): string {
    return `url(#${this.getClipPathId(skillName, star, context)})`;
  }

  hasNotes(skillName: string): boolean {
    const rating = this.playerRatings.find(r => r.skill_name === skillName);
    return rating ? !!rating.notes && rating.notes.trim().length > 0 : false;
  }

  showNotes(skillName: string): void {
    const rating = this.playerRatings.find(r => r.skill_name === skillName);
    if (rating && rating.notes) {
      alert(`Notes for ${skillName}:\n\n${rating.notes}`);
    }
  }

  getLastRatedDate(skillName: string): string {
    const rating = this.playerRatings.find(r => r.skill_name === skillName);
    if (rating) {
      return new Date(rating.rated_date).toLocaleDateString();
    }
    return '';
  }

  // Category methods
  getCategories(): string[] {
    return [...new Set(this.allSkills.map(skill => skill.category))];
  }

  getSkillsByCategory(category: string): VolleyballSkill[] {
    return this.allSkills.filter(skill => skill.category === category);
  }

  getCategoryAverage(category: string): string {
    if (!this.playerRatings || this.playerRatings.length === 0) return '-';
    
    const categoryRatings = this.playerRatings.filter(r => 
      r && r.skill_category === category && 
      r.rating !== null && r.rating !== undefined && !isNaN(r.rating)
    );
    
    if (categoryRatings.length === 0) return '-';
    
    const sum = categoryRatings.reduce((acc, rating) => acc + Number(rating.rating), 0);
    const average = sum / categoryRatings.length;
    
    return isNaN(average) ? '-' : average.toFixed(1);
  }

  getCategoryRatedCount(category: string): number {
    return this.playerRatings.filter(r => r.skill_category === category).length;
  }

  getCategorySkillCount(category: string): number {
    return this.allSkills.filter(skill => skill.category === category).length;
  }

  getCategoryColorClass(category: string): string {
    const colorMap: { [key: string]: string } = {
      'Serving': 'bg-blue-100 text-blue-800',
      'Passing': 'bg-green-100 text-green-800',
      'Setting': 'bg-purple-100 text-purple-800',
      'Attacking': 'bg-red-100 text-red-800',
      'Blocking': 'bg-yellow-100 text-yellow-800',
      'Movement': 'bg-indigo-100 text-indigo-800',
      'Mental': 'bg-pink-100 text-pink-800'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  }

  // Stats methods
  getOverallAverage(): string {
    if (!this.playerRatings || this.playerRatings.length === 0) return '-';
    
    // Filter out invalid ratings and calculate sum
    const validRatings = this.playerRatings.filter(rating => 
      rating && rating.rating !== null && rating.rating !== undefined && !isNaN(rating.rating)
    );
    
    if (validRatings.length === 0) return '-';
    
    const sum = validRatings.reduce((acc, rating) => acc + Number(rating.rating), 0);
    const average = sum / validRatings.length;
    
    return isNaN(average) ? '-' : average.toFixed(1);
  }

  getRatedSkillsCount(): number {
    return this.playerRatings.length;
  }

  getHighestRating(): string {
    if (this.playerRatings.length === 0) return '-';
    return Math.max(...this.playerRatings.map(r => r.rating)).toString();
  }

  getHighestSkill(): string {
    if (this.playerRatings.length === 0) return '';
    const highest = this.playerRatings.reduce((prev, current) => 
      prev.rating > current.rating ? prev : current
    );
    return highest.skill_name;
  }

  getCategoriesRatedCount(): number {
    const categories = new Set(this.playerRatings.map(r => r.skill_category));
    return categories.size;
  }

  getTotalCategoriesCount(): number {
    return this.getCategories().length;
  }

  // Bulk rating methods
  openBulkRatingModal(): void {
    this.showBulkModal = true;
    this.bulkRatings = {};
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
    this.bulkRatings = {};
  }

  handleBulkStarClick(skillName: string, starValue: number): void {
    const key = `bulk-${skillName}-${starValue}`;
    
    // Clear any existing timer for this star
    if (this.clickTimers[key]) {
      clearTimeout(this.clickTimers[key]);
    }
    
    // Initialize click count if not exists
    if (!this.clickCounts[key]) {
      this.clickCounts[key] = 0;
    }
    
    this.clickCounts[key]++;
    
    // Set a timer to handle the click(s)
    this.clickTimers[key] = setTimeout(() => {
      const clickCount = this.clickCounts[key];
      let finalRating: number;
      
      if (clickCount === 1) {
        // Single click - full star rating
        finalRating = starValue;
      } else {
        // Double click (or more) - half star rating
        finalRating = starValue - 0.5;
      }
      
      // Make sure rating is within valid range (0.5 to 5.0)
      finalRating = Math.max(0.5, Math.min(5.0, finalRating));
      
      this.setBulkRating(skillName, finalRating);
      
      // Reset click count
      this.clickCounts[key] = 0;
    }, this.DOUBLE_CLICK_DELAY);
  }

  setBulkRating(skillName: string, rating: number): void {
    this.bulkRatings[skillName] = rating;
  }

  getBulkRating(skillName: string): number {
    return this.bulkRatings[skillName] || 0;
  }

  // Bulk rating star display methods
  isBulkStarFull(skillName: string, starPosition: number): boolean {
    const rating = this.getBulkRating(skillName);
    return rating >= starPosition;
  }

  isBulkStarHalf(skillName: string, starPosition: number): boolean {
    const rating = this.getBulkRating(skillName);
    return rating === starPosition - 0.5;
  }

  isBulkStarEmpty(skillName: string, starPosition: number): boolean {
    const rating = this.getBulkRating(skillName);
    return rating < starPosition - 0.5;
  }

  hasBulkRatings(): boolean {
    return Object.keys(this.bulkRatings).length > 0;
  }

  submitBulkRating(): void {
    const ratings = Object.entries(this.bulkRatings).map(([skillName, rating]) => ({
      skill_name: skillName,
      rating: rating
    }));

    const request = {
      ratings,
      rated_date: new Date().toISOString().split('T')[0]
    };

    this.skillRatingService.bulkUpdateRatings(this.player.id, request).subscribe({
      next: () => {
        // Reload player ratings to update averages immediately
        this.skillRatingService.getPlayerRatings(this.player.id).subscribe({
          next: (ratings: SkillRating[]) => {
            this.playerRatings = ratings;
          },
          error: (error: any) => {
            console.error('Error reloading ratings after bulk update:', error);
          }
        });
        this.closeBulkModal();
        this.ratingsUpdated.emit();
      },
      error: (error) => {
        console.error('Error bulk updating ratings:', error);
        this.error = 'Failed to update ratings';
      }
    });
  }
}
