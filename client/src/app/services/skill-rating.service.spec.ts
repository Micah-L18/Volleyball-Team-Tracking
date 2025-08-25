import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SkillRatingService, VolleyballSkill, SkillRating, TeamSkillAverage, BulkRatingRequest } from './skill-rating.service';
import { environment } from '../../environments/environment';

describe('SkillRatingService', () => {
  let service: SkillRatingService;
  let httpMock: HttpTestingController;

  const mockSkills: VolleyballSkill[] = [
    {
      id: 1,
      name: 'Jump Serve',
      category: 'Serving',
      description: 'Jump serve skill'
    },
    {
      id: 2,
      name: 'Float Serve',
      category: 'Serving',
      description: 'Float serve skill'
    },
    {
      id: 3,
      name: 'Bump Pass',
      category: 'Passing',
      description: 'Bump pass skill'
    }
  ];

  const mockSkillRatings: SkillRating[] = [
    {
      id: 1,
      player_id: 1,
      skill_category: 'Serving',
      skill_name: 'Jump Serve',
      skill_description: 'Jump serve skill',
      rating: 3.5,
      notes: 'Good technique',
      rated_date: '2025-08-24',
      created_at: '2025-08-24T10:00:00Z',
      updated_at: '2025-08-24T10:00:00Z'
    },
    {
      id: 2,
      player_id: 1,
      skill_category: 'Serving',
      skill_name: 'Float Serve',
      skill_description: 'Float serve skill',
      rating: 4.0,
      notes: 'Excellent control',
      rated_date: '2025-08-24',
      created_at: '2025-08-24T10:00:00Z',
      updated_at: '2025-08-24T10:00:00Z'
    }
  ];

  const mockTeamAverages: TeamSkillAverage[] = [
    {
      skill_name: 'Jump Serve',
      skill_category: 'Serving',
      average_rating: 3.5,
      player_count: 3,
      max_rating: 4.0,
      min_rating: 3.0
    },
    {
      skill_name: 'Float Serve',
      skill_category: 'Serving',
      average_rating: 4.2,
      player_count: 3,
      max_rating: 5.0,
      min_rating: 3.5
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SkillRatingService]
    });

    service = TestBed.inject(SkillRatingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSkills', () => {
    it('should retrieve all volleyball skills', () => {
      service.getSkills().subscribe(skills => {
        expect(skills).toEqual(mockSkills);
        expect(skills.length).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSkills);
    });

    it('should handle error when retrieving skills', () => {
      service.getSkills().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getSkillsByCategory', () => {
    it('should retrieve skills by category', () => {
      const category = 'Serving';
      const servingSkills = mockSkills.filter(skill => skill.category === category);

      service.getSkillsByCategory(category).subscribe(skills => {
        expect(skills).toEqual(servingSkills);
        expect(skills.length).toBe(2);
        expect(skills.every(skill => skill.category === category)).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills/category/${category}`);
      expect(req.request.method).toBe('GET');
      req.flush(servingSkills);
    });
  });

  describe('getPlayerRatings', () => {
    it('should retrieve ratings for a specific player', () => {
      const playerId = 1;

      service.getPlayerRatings(playerId).subscribe(ratings => {
        expect(ratings).toEqual(mockSkillRatings);
        expect(ratings.length).toBe(2);
        expect(ratings.every(rating => rating.player_id === playerId)).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSkillRatings);
    });
  });

  describe('getTeamSkillAverages', () => {
    it('should retrieve team skill averages', () => {
      const teamId = 1;

      service.getTeamSkillAverages(teamId).subscribe(averages => {
        expect(averages).toEqual(mockTeamAverages);
        expect(averages.length).toBe(2);
        expect(averages[0].skill_name).toBe('Jump Serve');
        expect(averages[1].skill_name).toBe('Float Serve');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/team/${teamId}/averages`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTeamAverages);
    });

    it('should handle empty team averages', () => {
      const teamId = 999; // Non-existent team

      service.getTeamSkillAverages(teamId).subscribe(averages => {
        expect(averages).toEqual([]);
        expect(averages.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/team/${teamId}/averages`);
      req.flush([]);
    });
  });

  describe('updateSkillRating', () => {
    it('should update a player skill rating', () => {
      const playerId = 1;
      const skillName = 'Jump Serve';
      const rating = 4.5;
      const notes = 'Improved technique';

      const updatedRating: SkillRating = {
        ...mockSkillRatings[0],
        rating: rating,
        notes: notes,
        updated_at: '2025-08-24T11:00:00Z'
      };

      service.updateSkillRating(playerId, skillName, rating, notes).subscribe((result: SkillRating) => {
        expect(result).toEqual(updatedRating);
        expect(result.rating).toBe(rating);
        expect(result.notes).toBe(notes);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}/skill/${encodeURIComponent(skillName)}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.rating).toBe(rating);
      expect(req.request.body.notes).toBe(notes);
      expect(req.request.body.rated_date).toBeDefined();
      req.flush(updatedRating);
    });

    it('should handle invalid rating value', () => {
      const playerId = 1;
      const skillName = 'Jump Serve';
      const invalidRating = 6.0; // Outside valid range
      const notes = 'Invalid rating';

      service.updateSkillRating(playerId, skillName, invalidRating, notes).subscribe({
        next: () => fail('should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}/skill/${encodeURIComponent(skillName)}`);
      req.flush('Invalid rating value', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('bulkUpdateRatings', () => {
    it('should bulk update player ratings', () => {
      const playerId = 1;
      const bulkRequest: BulkRatingRequest = {
        ratings: [
          { skill_name: 'Jump Serve', rating: 4.0, notes: 'Improved' },
          { skill_name: 'Float Serve', rating: 4.5, notes: 'Excellent' }
        ],
        rated_date: '2025-08-24'
      };

      const updatedRatings: SkillRating[] = [
        { ...mockSkillRatings[0], rating: 4.0, notes: 'Improved' },
        { ...mockSkillRatings[1], rating: 4.5, notes: 'Excellent' }
      ];

      const response = { message: 'Updated successfully', ratings: updatedRatings };

      service.bulkUpdateRatings(playerId, bulkRequest).subscribe((result: {message: string, ratings: SkillRating[]}) => {
        expect(result.ratings).toEqual(updatedRatings);
        expect(result.ratings.length).toBe(2);
        expect(result.message).toBe('Updated successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}/bulk-update`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(bulkRequest);
      req.flush(response);
    });
  });

  describe('deleteSkillRating', () => {
    it('should delete a player skill rating', () => {
      const playerId = 1;
      const skillName = 'Jump Serve';

      service.deleteSkillRating(playerId, skillName).subscribe((result: {message: string}) => {
        expect(result.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}/skill/${encodeURIComponent(skillName)}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted successfully' });
    });
  });

  describe('getSkillsByCategories', () => {
    it('should group skills by categories', () => {
      // First call getSkills to populate skillsByCategory
      service.getSkills().subscribe(() => {
        const groupedSkills = service.getSkillsByCategories();
        
        expect(groupedSkills['Serving']).toBeDefined();
        expect(groupedSkills['Passing']).toBeDefined();
        expect(groupedSkills['Serving'].length).toBe(2);
        expect(groupedSkills['Passing'].length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills`);
      req.flush(mockSkills);
    });

    it('should return empty object when no skills loaded', () => {
      const groupedSkills = service.getSkillsByCategories();
      expect(Object.keys(groupedSkills).length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', () => {
      service.getSkills().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle HTTP error responses', () => {
      service.getTeamSkillAverages(1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/team/1/averages`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete rating workflow', () => {
      const playerId = 1;
      const teamId = 1;
      
      // 1. Load skills
      service.getSkills().subscribe(skills => {
        expect(skills.length).toBeGreaterThan(0);
      });

      let req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/skills`);
      req.flush(mockSkills);

      // 2. Load player ratings
      service.getPlayerRatings(playerId).subscribe(ratings => {
        expect(ratings.length).toBeGreaterThan(0);
      });

      req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}`);
      req.flush(mockSkillRatings);

      // 3. Update a rating
      service.updateSkillRating(playerId, 'Jump Serve', 4.0, 'Improved').subscribe((result: SkillRating) => {
        expect(result.rating).toBe(4.0);
      });

      req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/player/${playerId}/skill/Jump%20Serve`);
      req.flush({ ...mockSkillRatings[0], rating: 4.0, notes: 'Improved' });

      // 4. Check team averages
      service.getTeamSkillAverages(teamId).subscribe(averages => {
        expect(averages.length).toBeGreaterThan(0);
      });

      req = httpMock.expectOne(`${environment.apiUrl}/skill-ratings/team/${teamId}/averages`);
      req.flush(mockTeamAverages);
    });
  });
});
