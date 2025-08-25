import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { AnalyticsService, TeamAnalytics } from '../../services/analytics.service';
import { TeamDetails } from '../../models/types';

describe('AnalyticsDashboardComponent', () => {
  let component: AnalyticsDashboardComponent;
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  const mockTeam: TeamDetails = {
    id: 1,
    name: 'Test Team',
    description: 'Test Description',
    season: '2025',
    members: [],
    userRole: 'head_coach'
  };

  const mockAnalytics: TeamAnalytics = {
    totalPlayers: 3,
    totalSkillsRated: 5,
    overallTeamAverage: 3.8,
    topStrengths: [
      {
        skillName: 'Float Serve',
        category: 'Serving',
        averageRating: 4.2,
        playerCount: 3,
        percentageOfTeam: 100
      }
    ],
    improvementAreas: [
      {
        skillName: 'Jump Serve',
        category: 'Serving',
        averageRating: 3.0,
        playerCount: 3,
        improvementPotential: 2.0
      }
    ],
    categoryBreakdown: [
      {
        category: 'Serving',
        averageRating: 3.8,
        skillCount: 2,
        ratedSkillCount: 2,
        completionPercentage: 100,
        topSkill: 'Float Serve',
        weakestSkill: 'Jump Serve'
      }
    ],
    playerComparison: [],
    progressData: []
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AnalyticsService', [
      'getTeamAnalytics', 
      'generateInsights', 
      'exportTeamReport',
      'getPlayerComparison',
      'getProgressData'
    ]);

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent, HttpClientTestingModule],
      providers: [
        { provide: AnalyticsService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
    analyticsServiceSpy = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    
    // Set up the team input
    component.team = mockTeam;

    // Set up default mock returns for new methods
    analyticsServiceSpy.getPlayerComparison.and.returnValue(of([]));
    analyticsServiceSpy.getProgressData.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load analytics on init when team is provided', () => {
    analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics));
    analyticsServiceSpy.generateInsights.and.returnValue([]);
    analyticsServiceSpy.getPlayerComparison.and.returnValue(of([]));
    analyticsServiceSpy.getProgressData.and.returnValue(of([]));

    component.ngOnInit();

    expect(analyticsServiceSpy.getTeamAnalytics).toHaveBeenCalledWith(1);
    expect(analyticsServiceSpy.getPlayerComparison).toHaveBeenCalledWith(1);
    expect(analyticsServiceSpy.getProgressData).toHaveBeenCalledWith(1, '6months');
    expect(component.analytics).toEqual(mockAnalytics);
    expect(component.loading).toBeFalse();
  });

  it('should handle analytics loading error', () => {
    const errorMessage = 'Failed to load analytics';
    analyticsServiceSpy.getTeamAnalytics.and.returnValue(throwError(() => new Error(errorMessage)));
    analyticsServiceSpy.getPlayerComparison.and.returnValue(of([]));
    analyticsServiceSpy.getProgressData.and.returnValue(of([]));

    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Failed to load team analytics');
  });

  it('should refresh analytics when requested', () => {
    analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics));
    analyticsServiceSpy.generateInsights.and.returnValue([]);
    analyticsServiceSpy.getPlayerComparison.and.returnValue(of([]));
    analyticsServiceSpy.getProgressData.and.returnValue(of([]));

    component.refreshAnalytics();

    expect(analyticsServiceSpy.getTeamAnalytics).toHaveBeenCalledWith(1);
    expect(analyticsServiceSpy.getPlayerComparison).toHaveBeenCalledWith(1);
    expect(analyticsServiceSpy.getProgressData).toHaveBeenCalledWith(1, '6months');
    expect(component.loading).toBeFalse();
  });

  it('should handle export report', () => {
    component.analytics = mockAnalytics;
    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    analyticsServiceSpy.exportTeamReport.and.returnValue(of(mockBlob));

    // Mock URL and link creation
    spyOn(window.URL, 'createObjectURL').and.returnValue('mock-url');
    spyOn(window.URL, 'revokeObjectURL');
    const mockLink = { href: '', download: '', click: jasmine.createSpy('click') };
    spyOn(document, 'createElement').and.returnValue(mockLink as any);

    component.exportReport();

    expect(analyticsServiceSpy.exportTeamReport).toHaveBeenCalledWith(1, 'Test Team');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should display team analytics data correctly', () => {
    analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics));
    analyticsServiceSpy.generateInsights.and.returnValue([]);
    
    component.analytics = mockAnalytics;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('3.8/5.0');
    expect(compiled.textContent).toContain('3');
    expect(compiled.textContent).toContain('5');
  });
});
