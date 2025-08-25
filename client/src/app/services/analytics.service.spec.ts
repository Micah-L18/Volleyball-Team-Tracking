import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { SkillRatingService, TeamSkillAverage, VolleyballSkill } from './skill-rating.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;
  let skillRatingServiceSpy: jasmine.SpyObj<SkillRatingService>;

  const mockTeamId = 1;

  const mockTeamAverages: TeamSkillAverage[] = [
    {
      skill_name: 'Jump Serve',
      skill_category: 'Serving',
      average_rating: 3.5,
      player_count: 3,
      max_rating: 4.5,
      min_rating: 2.5
    },
    {
      skill_name: 'Float Serve',
      skill_category: 'Serving', 
      average_rating: 4.2,
      player_count: 3,
      max_rating: 5.0,
      min_rating: 3.5
    },
    {
      skill_name: 'Bump Pass',
      skill_category: 'Passing',
      average_rating: 3.8,
      player_count: 3,
      max_rating: 4.0,
      min_rating: 3.5
    }
  ];

  const mockPlayers = [
    { id: 1, name: 'Player 1', position: 'Outside Hitter', team_id: 1 },
    { id: 2, name: 'Player 2', position: 'Setter', team_id: 1 },
    { id: 3, name: 'Player 3', position: 'Middle Blocker', team_id: 1 }
  ];

  const mockSkills: VolleyballSkill[] = [
    { id: 1, name: 'Jump Serve', category: 'Serving', description: 'Jump serve skill' },
    { id: 2, name: 'Float Serve', category: 'Serving', description: 'Float serve skill' },
    { id: 3, name: 'Bump Pass', category: 'Passing', description: 'Bump pass skill' }
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SkillRatingService', ['getTeamSkillAverages', 'getSkills']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AnalyticsService,
        { provide: SkillRatingService, useValue: spy }
      ]
    });

    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
    skillRatingServiceSpy = TestBed.inject(SkillRatingService) as jasmine.SpyObj<SkillRatingService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate team analytics correctly', (done) => {
    // Setup mock responses
    skillRatingServiceSpy.getTeamSkillAverages.and.returnValue(of(mockTeamAverages));
    skillRatingServiceSpy.getSkills.and.returnValue(of(mockSkills));

    service.getTeamAnalytics(mockTeamId).subscribe(analytics => {
      expect(analytics.totalPlayers).toBe(3);
      expect(analytics.totalSkillsRated).toBe(3);
      expect(analytics.overallTeamAverage).toBeCloseTo(3.83, 1); // (3.5 + 4.2 + 3.8) / 3
      expect(analytics.categoryBreakdown).toBeDefined();
      expect(analytics.categoryBreakdown.length).toBe(2); // Serving and Passing
      expect(analytics.topStrengths).toBeDefined();
      expect(analytics.topStrengths.length).toBeGreaterThan(0);
      done();
    });

    // Expect HTTP call for players
    const req = httpMock.expectOne(`http://localhost:3002/api/players/team/${mockTeamId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlayers);
  });

  it('should identify top strengths correctly', (done) => {
    skillRatingServiceSpy.getTeamSkillAverages.and.returnValue(of(mockTeamAverages));
    skillRatingServiceSpy.getSkills.and.returnValue(of(mockSkills));

    service.getTeamAnalytics(mockTeamId).subscribe(analytics => {
      expect(analytics.topStrengths.length).toBeGreaterThan(0);
      // Float Serve should be the top strength (highest rating: 4.2)
      expect(analytics.topStrengths[0].skillName).toBe('Float Serve');
      expect(analytics.topStrengths[0].averageRating).toBe(4.2);
      done();
    });

    const req = httpMock.expectOne(`http://localhost:3002/api/players/team/${mockTeamId}`);
    req.flush(mockPlayers);
  });

  it('should generate category breakdown correctly', (done) => {
    skillRatingServiceSpy.getTeamSkillAverages.and.returnValue(of(mockTeamAverages));
    skillRatingServiceSpy.getSkills.and.returnValue(of(mockSkills));

    service.getTeamAnalytics(mockTeamId).subscribe(analytics => {
      const servingCategory = analytics.categoryBreakdown.find(cat => cat.category === 'Serving');
      const passingCategory = analytics.categoryBreakdown.find(cat => cat.category === 'Passing');

      expect(servingCategory).toBeDefined();
      expect(passingCategory).toBeDefined();
      
      if (servingCategory) {
        expect(servingCategory.averageRating).toBeCloseTo(3.85, 1); // (3.5 + 4.2) / 2
        expect(servingCategory.skillCount).toBe(2);
      }
      
      if (passingCategory) {
        expect(passingCategory.averageRating).toBe(3.8);
        expect(passingCategory.skillCount).toBe(1);
      }
      done();
    });

    const req = httpMock.expectOne(`http://localhost:3002/api/players/team/${mockTeamId}`);
    req.flush(mockPlayers);
  });

  it('should handle empty data gracefully', (done) => {
    skillRatingServiceSpy.getTeamSkillAverages.and.returnValue(of([]));
    skillRatingServiceSpy.getSkills.and.returnValue(of([]));

    service.getTeamAnalytics(mockTeamId).subscribe(analytics => {
      expect(analytics.totalPlayers).toBe(0);
      expect(analytics.totalSkillsRated).toBe(0);
      expect(analytics.overallTeamAverage).toBe(0);
      expect(analytics.categoryBreakdown.length).toBe(0);
      expect(analytics.topStrengths.length).toBe(0);
      done();
    });

    const req = httpMock.expectOne(`http://localhost:3002/api/players/team/${mockTeamId}`);
    req.flush([]);
  });
});