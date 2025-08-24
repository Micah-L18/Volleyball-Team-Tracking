# Developer Onboarding Guide - Volleyball Coach App

## Quick Reference for Claude AI Development

This guide is specifically designed for AI assistants to efficiently understand and continue development of the Volleyball Coach Assistant App.

## File Locations & Responsibilities

### Frontend Structure (`client/src/app/`)

#### Core Components
```
components/
├── roster/
│   ├── roster.component.ts          # Main team interface with tabs
│   ├── roster.component.html        # Player grid + tab layout  
│   └── roster.component.scss        # Responsive grid styling
├── team-skill-dashboard/
│   ├── team-skill-dashboard.component.ts    # Analytics calculations
│   └── team-skill-dashboard.component.html  # Insights display
├── team-schedule/
│   ├── team-schedule.component.ts   # Event management
│   └── team-schedule.component.html # Calendar/list views
└── player-form/
    ├── player-form.component.ts     # Player CRUD operations
    └── player-form.component.html   # Form with validation
```

#### Dialogs (`dialogs/`)
```
dialogs/
├── player-dialog.component.ts       # Player creation/editing modal
├── team-dialog.component.ts         # Team creation/editing modal  
├── schedule-dialog.component.ts     # Event creation modal
└── skill-rating-dialog.component.ts # Individual skill rating
```

#### Services (`services/`)
```
services/
├── auth.service.ts                  # JWT authentication + role management
├── team.service.ts                  # Team CRUD operations
├── player.service.ts                # Player CRUD operations
├── skill-rating.service.ts          # Skill ratings + calculations
├── development.service.ts           # Development plans
├── team-access.service.ts           # User invitations and role management
├── video.service.ts                 # Video upload and attachment
├── statistics.service.ts            # Statistics import/export and analytics
└── comment.service.ts               # Player comments on notes
```

#### Models (`models/`)
```
models/
└── types.ts                         # All TypeScript interfaces
```

### Backend Structure (`server/`)

#### API Routes (`routes/`)
```
routes/
├── auth.js                          # POST /login, /register
├── teams.js                         # Team CRUD endpoints
├── players.js                       # Player CRUD endpoints
├── skill-ratings.js                 # Skill rating operations
├── development.js                   # Development plan endpoints
├── team-access.js                   # User invitations and role management
├── videos.js                        # Video upload and attachment
├── statistics.js                    # Statistics import/export
└── comments.js                      # Player comments system
```

#### Database (`models/`)
```
models/
└── db.js                           # PostgreSQL connection pool
```

#### Scripts (`scripts/`)
```
scripts/
├── init-db.js                      # Database schema creation
└── add-teams.js                    # Schema migrations
```

## Key Implementation Patterns

### 1. Authentication Flow
```typescript
// Frontend: auth.service.ts
login(email: string, password: string) {
  return this.http.post<AuthResponse>('/api/auth/login', { email, password })
    .pipe(
      tap(response => localStorage.setItem('token', response.token))
    );
}

// Backend: middleware/auth.js  
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.coach = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2. Skill Rating Calculations
```typescript
// skill-rating.service.ts
calculateOverallScore(ratings: SkillRating[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

// Usage in roster.component.ts
getPlayerOverallRating(playerId: number): number {
  const ratings = this.playerSkillRatings[playerId];
  if (!ratings || ratings.length === 0) return 0;
  return this.skillRatingService.calculateOverallScore(ratings);
}
```

### 3. Tab Navigation Pattern
```html
<!-- roster.component.html -->
<mat-tab-group [selectedIndex]="selectedTabIndex" (selectedTabChange)="onTabChange($event.index)">
  <mat-tab label="Roster">
    <!-- Player grid and analytics -->
  </mat-tab>
  <mat-tab label="Schedule">
    <app-team-schedule [teamId]="teamId!"></app-team-schedule>
  </mat-tab>
</mat-tab-group>
```

### 4. Database Query Patterns
```javascript
// Backend: teams.js
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team WHERE coach_id = $1 ORDER BY created_at DESC',
      [req.coach.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});
```

## Data Flow Architecture

### 1. Player Skill Ratings Flow
```
Frontend Component → Service → HTTP Request → Backend Route → Database Query → Response → Service → Component Update
```

**Example**: Loading player ratings in roster
1. `roster.component.ts` calls `loadPlayersSkillRatings()`
2. `skill-rating.service.ts` makes parallel HTTP requests
3. `GET /api/skill-ratings/player/:id` endpoint
4. Database query: `SELECT * FROM skill_ratings WHERE player_id = $1`
5. Response mapped to `SkillRating[]` interface
6. Component calculates overall scores and displays stars

### 2. Team Analytics Flow
```
Raw Skill Ratings → Category Grouping → Statistical Analysis → Insight Generation → Dashboard Display
```

**Implementation**: `team-skill-dashboard.component.ts`
- Groups ratings by category (Technical, Physical, Mental, Tactical)
- Calculates team averages per skill
- Identifies top strengths (>4.0 rating)
- Finds development priorities (<3.0 rating)
- Displays insights in organized panels

## Critical Business Logic

### 1. Skill Categories & Skills
```typescript
// Predefined skill structure
const SKILL_CATEGORIES = {
  Technical: ['Serving Accuracy', 'Serving Power', 'Passing Accuracy', 'Setting Precision', 'Spiking Technique', 'Blocking Technique'],
  Physical: ['Vertical Jump', 'Speed', 'Agility', 'Strength', 'Endurance', 'Flexibility'],
  Mental: ['Focus', 'Leadership', 'Communication', 'Mental Toughness', 'Game Awareness'],
  Tactical: ['Court Positioning', 'Decision Making', 'Team Chemistry', 'Game Strategy']
};
```

### 2. Rating Scale System
- **Range**: 0.0 to 5.0 (0.5 increments)
- **Display**: Star system (★★★☆☆)
- **Calculation**: Average of all skill ratings per player
- **Validation**: Database constraint `CHECK (rating >= 0 AND rating <= 5)`

### 3. Team Insights Algorithm
```typescript
// team-skill-dashboard.component.ts
analyzeTeamSkills(averages: TeamSkillAverage[]) {
  const insights = {
    topStrengths: averages.filter(avg => avg.average_rating >= 4.0),
    wellBalanced: averages.filter(avg => avg.average_rating >= 3.0 && avg.average_rating < 4.0),
    priorities: averages.filter(avg => avg.average_rating < 3.0)
  };
  return insights;
}
```

## Common Development Tasks

### Adding a New Skill Category

1. **Database**: Update `volleyball_skills` table
```sql
INSERT INTO volleyball_skills (name, category, description) VALUES 
('New Skill', 'New Category', 'Description');
```

2. **Frontend**: Update skill categories in service
```typescript
// skill-rating.service.ts
const CATEGORIES = ['Technical', 'Physical', 'Mental', 'Tactical', 'New Category'];
```

3. **Update Components**: Modify dashboard to handle new category

### Adding a New Player Attribute

1. **Database Migration**:
```sql
ALTER TABLE player ADD COLUMN new_attribute VARCHAR(100);
```

2. **Update Interface**:
```typescript
// types.ts
interface Player {
  // existing fields...
  new_attribute?: string;
}
```

3. **Update Forms**: Add form field to `player-dialog.component.html`

4. **Update API**: Modify player routes to handle new field

### Creating a New Component

1. **Generate Component**:
```bash
ng generate component components/new-feature --standalone
```

2. **Import Required Modules**:
```typescript
imports: [CommonModule, MatButtonModule, MatIconModule, ...]
```

3. **Add to Parent**: Import and use in parent component

4. **Create Service** (if needed):
```bash
ng generate service services/new-feature
```

## Testing Strategies

### Unit Testing Pattern
```typescript
// Example: skill-rating.service.spec.ts
describe('SkillRatingService', () => {
  let service: SkillRatingService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillRatingService);
  });

  it('should calculate overall score correctly', () => {
    const ratings: SkillRating[] = [
      { rating: 4.0 }, { rating: 3.0 }, { rating: 5.0 }
    ];
    expect(service.calculateOverallScore(ratings)).toBe(4.0);
  });
});
```

### API Testing Pattern
```javascript
// Example: test-skill-ratings.js
const request = require('supertest');
const app = require('../index');

describe('Skill Ratings API', () => {
  it('should get player skill ratings', async () => {
    const response = await request(app)
      .get('/api/skill-ratings/player/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

## Error Handling Patterns

### Frontend Error Handling
```typescript
// Standard service error handling
getTeamPlayers(teamId: number): Observable<Player[]> {
  return this.http.get<Player[]>(`${this.apiUrl}/team/${teamId}`)
    .pipe(
      catchError(error => {
        console.error('Error loading players:', error);
        return throwError(() => error);
      })
    );
}

// Component error handling
loadPlayers(teamId: number) {
  this.playerService.getTeamPlayers(teamId).subscribe({
    next: (players) => this.players = players,
    error: (error) => this.errorMessage = 'Failed to load players'
  });
}
```

### Backend Error Handling
```javascript
// Standard route error handling
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM player WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Performance Considerations

### Frontend Optimization
1. **OnPush Change Detection**: Use for components with minimal updates
2. **TrackBy Functions**: For *ngFor loops with large datasets
3. **Lazy Loading**: Route-based code splitting
4. **Service Caching**: Cache frequently accessed data

### Backend Optimization
1. **Database Indexing**: Index foreign keys and frequently queried columns
2. **Connection Pooling**: Reuse database connections
3. **Query Optimization**: Use efficient JOIN operations
4. **Response Compression**: Enable gzip compression

### Database Optimization
```sql
-- Recommended indexes
CREATE INDEX idx_player_team_id ON player(team_id);
CREATE INDEX idx_skill_ratings_player_id ON skill_ratings(player_id);
CREATE INDEX idx_team_coach_id ON team(coach_id);
```

## Deployment Checklist

### Environment Variables
```bash
# Production .env
NODE_ENV=production
PORT=3002
DB_HOST=production_host
DB_NAME=coach_app_prod
DB_USER=app_user
DB_PASSWORD=secure_password
JWT_SECRET=production_jwt_secret
```

### Build Commands
```bash
# Frontend build
ng build --configuration production

# Backend deployment
npm install --production
pm2 start index.js --name volleyball-coach-api
```

This guide provides the essential information needed for efficient development and maintenance of the Volleyball Coach Assistant App.
