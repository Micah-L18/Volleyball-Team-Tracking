# Technical Specification - Volleyball Coach App

## Complete Implementation Guide for Clean Rebuild

This document provides exact implementation details for rebuilding the Volleyball Coach App from scratch with clean, well-structured code.

## Database Schema - Complete SQL

### 1. Database Creation
```sql
-- Create database and user
CREATE DATABASE coach_app;
CREATE USER coach_app_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coach_app TO coach_app_user;
```

### 2. Complete Table Definitions
```sql
-- Coaches table
CREATE TABLE coach (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE team (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(100),
  season VARCHAR(50),
  description TEXT,
  photo_url VARCHAR(500),
  coach_id INTEGER REFERENCES coach(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team users and invitations table
CREATE TABLE team_users (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'player', 'coach')),
  player_id INTEGER REFERENCES player(id) ON DELETE SET NULL,
  invited_by INTEGER REFERENCES coach(id),
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(team_id, user_email)
);

-- Players table
CREATE TABLE player (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50),
  year VARCHAR(30),
  jersey_number INTEGER,
  height VARCHAR(20),
  reach VARCHAR(20),
  dominant_hand VARCHAR(10) CHECK (dominant_hand IN ('Left', 'Right', 'Ambidextrous')),
  contact_info VARCHAR(255),
  notes TEXT,
  photo_url VARCHAR(500),
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volleyball skills reference table
CREATE TABLE volleyball_skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill ratings table
CREATE TABLE skill_ratings (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  skill_category VARCHAR(50) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  skill_description TEXT,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  rated_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, skill_name)
);

-- Development areas table
CREATE TABLE development_areas (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  skill_category VARCHAR(50) NOT NULL,
  priority_level INTEGER CHECK (priority_level >= 1 AND priority_level <= 5),
  description TEXT,
  target_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video attachments table
CREATE TABLE video_attachments (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES coach(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note videos linking table
CREATE TABLE note_videos (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES video_attachments(id) ON DELETE CASCADE,
  note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('skill_rating', 'development_area', 'general_note')),
  reference_id INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player comments table
CREATE TABLE player_comments (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('skill_rating', 'development_area', 'general_note')),
  reference_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player statistics table
CREATE TABLE player_statistics (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL,
  stat_name VARCHAR(100) NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,
  stat_date DATE NOT NULL,
  game_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team statistics table
CREATE TABLE team_statistics (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL,
  stat_name VARCHAR(100) NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,
  stat_date DATE NOT NULL,
  game_type VARCHAR(50),
  opponent VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule events table
CREATE TABLE schedule_events (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Practice', 'Scrimmage', 'Game', 'Tournament')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  opponent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_player_team_id ON player(team_id);
CREATE INDEX idx_skill_ratings_player_id ON skill_ratings(player_id);
CREATE INDEX idx_skill_ratings_category ON skill_ratings(skill_category);
CREATE INDEX idx_team_coach_id ON team(coach_id);
CREATE INDEX idx_development_areas_player_id ON development_areas(player_id);
CREATE INDEX idx_schedule_events_team_id ON schedule_events(team_id);
CREATE INDEX idx_schedule_events_date ON schedule_events(event_date);
CREATE INDEX idx_team_users_team_id ON team_users(team_id);
CREATE INDEX idx_team_users_email ON team_users(user_email);
CREATE INDEX idx_player_comments_player_id ON player_comments(player_id);
CREATE INDEX idx_player_statistics_player_id ON player_statistics(player_id);
CREATE INDEX idx_team_statistics_team_id ON team_statistics(team_id);
CREATE INDEX idx_note_videos_player_id ON note_videos(player_id);
CREATE INDEX idx_note_videos_video_id ON note_videos(video_id);
```

### 3. Initial Data Population
```sql
-- Insert volleyball skills
INSERT INTO volleyball_skills (name, category, description) VALUES
-- Technical Skills
('Serving Accuracy', 'Technical', 'Precision and consistency in serve placement'),
('Serving Power', 'Technical', 'Force and speed of serves'),
('Passing Accuracy', 'Technical', 'Precise ball control and platform passing'),
('Passing Reception', 'Technical', 'Receiving and controlling incoming serves and attacks'),
('Setting Precision', 'Technical', 'Accurate ball placement for attackers'),
('Spiking Technique', 'Technical', 'Attack form and execution'),
('Blocking Technique', 'Technical', 'Defensive blocking form and positioning'),
('Blocking Timing', 'Technical', 'Timing and reaction in blocking situations'),

-- Physical Skills
('Vertical Jump', 'Physical', 'Maximum jumping height and power'),
('Speed', 'Physical', 'Court movement and reaction speed'),
('Agility', 'Physical', 'Quick direction changes and footwork'),
('Strength', 'Physical', 'Overall physical power and endurance'),
('Endurance', 'Physical', 'Cardiovascular fitness and stamina'),
('Flexibility', 'Physical', 'Range of motion and injury prevention'),

-- Mental Skills
('Focus', 'Mental', 'Concentration and mental discipline'),
('Leadership', 'Mental', 'Team motivation and game management'),
('Communication', 'Mental', 'On-court verbal and non-verbal communication'),
('Mental Toughness', 'Mental', 'Resilience under pressure and adversity'),
('Game Awareness', 'Mental', 'Reading the game and anticipation'),

-- Tactical Skills
('Court Positioning', 'Tactical', 'Understanding of court zones and movement'),
('Decision Making', 'Tactical', 'Quick strategic choices during play'),
('Team Chemistry', 'Tactical', 'Coordination and teamwork with other players'),
('Game Strategy', 'Tactical', 'Understanding and execution of game plans');
```

## Backend Implementation

### 1. Package.json Dependencies
```json
{
  "name": "volleyball-coach-api",
  "version": "1.0.0",
  "description": "API for volleyball coach assistant app",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "init-db": "node scripts/init-db.js",
    "test": "jest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5",
    "pg": "^8.11.3",
    "nodemailer": "^6.9.8",
    "csv-parser": "^3.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  }
}
```

### 2. Environment Configuration (.env)
```env
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coach_app
DB_USER=coach_app_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
CORS_ORIGIN=http://localhost:4200
```

### 3. Database Connection (models/db.js)
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;
```

### 4. Authentication Middleware (middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.coach = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
```

### 5. Main Server File (index.js)
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const playerRoutes = require('./routes/players');
const skillRatingRoutes = require('./routes/skill-ratings');
const developmentRoutes = require('./routes/development');
const scheduleRoutes = require('./routes/schedule');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/skill-ratings', skillRatingRoutes);
app.use('/api/development', developmentRoutes);
app.use('/api/schedule', scheduleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
```

## Frontend Implementation

### 1. Package.json Dependencies
```json
{
  "name": "volleyball-coach-client",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/cdk": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.3",
    "tailwindcss": "^3.4.0",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^18.0.0",
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.7.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.4.0"
  }
}
```

### 2. TypeScript Interfaces (models/types.ts)
```typescript
// Authentication interfaces
export interface Coach {
  id: number;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  coach: Coach;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Team interfaces
export interface Team {
  id?: number;
  name: string;
  level?: string;
  season?: string;
  description?: string;
  photo_url?: string;
  coach_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TeamUser {
  id?: number;
  team_id: number;
  user_email: string;
  user_name?: string;
  role: 'viewer' | 'player' | 'coach';
  player_id?: number;
  invited_by?: number;
  invited_at?: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface TeamInvitation {
  team_id: number;
  user_email: string;
  user_name?: string;
  role: 'viewer' | 'player' | 'coach';
  player_id?: number;
  message?: string;
}

// Player interfaces
export interface Player {
  id?: number;
  name: string;
  position?: string;
  year?: string;
  jersey_number?: number;
  height?: string;
  reach?: string;
  dominant_hand?: 'Left' | 'Right' | 'Ambidextrous';
  contact_info?: string;
  notes?: string;
  photo_url?: string;
  team_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Skill rating interfaces
export interface VolleyballSkill {
  id: number;
  name: string;
  category: string;
  description?: string;
  created_at: string;
}

export interface SkillRating {
  id?: number;
  player_id: number;
  skill_category: string;
  skill_name: string;
  skill_description?: string;
  rating: number;
  notes?: string;
  rated_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SkillRatingUpdate {
  rating: number;
  notes?: string;
  rated_date: string;
}

export interface TeamSkillAverage {
  skill_name: string;
  skill_category: string;
  average_rating: number;
  player_count: number;
}

// Development interfaces
export interface DevelopmentArea {
  id?: number;
  player_id: number;
  skill_category: string;
  priority_level: number;
  description: string;
  target_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Video attachment interfaces
export interface VideoAttachment {
  id?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: number;
  uploaded_at?: string;
}

export interface NoteVideo {
  id?: number;
  player_id: number;
  video_id: number;
  note_type: 'skill_rating' | 'development_area' | 'general_note';
  reference_id?: number;
  description?: string;
  created_at?: string;
}

// Comment interfaces
export interface PlayerComment {
  id?: number;
  player_id: number;
  reference_type: 'skill_rating' | 'development_area' | 'general_note';
  reference_id: number;
  comment_text: string;
  created_at?: string;
  updated_at?: string;
}

// Statistics interfaces
export interface PlayerStatistic {
  id?: number;
  player_id: number;
  stat_category: string;
  stat_name: string;
  stat_value: number;
  stat_date: string;
  game_type?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamStatistic {
  id?: number;
  team_id: number;
  stat_category: string;
  stat_name: string;
  stat_value: number;
  stat_date: string;
  game_type?: string;
  opponent?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatisticImport {
  file: File;
  type: 'player' | 'team';
  target_id: number;
}

// Schedule interfaces
export interface ScheduleEvent {
  id?: number;
  team_id: number;
  event_type: 'Practice' | 'Scrimmage' | 'Game' | 'Tournament';
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  opponent?: string;
  created_at?: string;
  updated_at?: string;
}

// Analytics interfaces
export interface TeamInsights {
  topStrengths: TeamSkillAverage[];
  wellBalanced: TeamSkillAverage[];
  priorities: TeamSkillAverage[];
}

export interface SkillCategoryBreakdown {
  category: string;
  averageRating: number;
  skillCount: number;
  topSkill: string;
  lowestSkill: string;
}

// UI state interfaces
export interface TabState {
  selectedIndex: number;
  tabs: TabInfo[];
}

export interface TabInfo {
  label: string;
  route?: string;
  component?: string;
}

// Form interfaces
export interface PlayerFormData {
  player: Partial<Player>;
  isEdit: boolean;
  teamId: number;
}

export interface SkillRatingFormData {
  rating: SkillRating;
  isEdit: boolean;
  availableSkills: VolleyballSkill[];
}

// API response interfaces
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error handling interfaces
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}
```

### 3. Authentication Service (services/auth.service.ts)
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Coach, AuthResponse, LoginRequest, RegisterRequest } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3002/api/auth';
  private currentCoachSubject = new BehaviorSubject<Coach | null>(null);
  public currentCoach$ = this.currentCoachSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCurrentCoach();
  }

  private loadCurrentCoach(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      // In a real app, you'd decode the JWT to get coach info
      // For now, we'll make a call to get current coach info
      this.getCurrentCoach().subscribe({
        next: (coach) => this.currentCoachSubject.next(coach),
        error: () => this.logout()
      });
    }
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.currentCoachSubject.next(response.coach);
        }),
        catchError(this.handleError)
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.currentCoachSubject.next(response.coach);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentCoachSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentCoach(): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    const errorMessage = error.error?.error || error.message || 'An error occurred';
    return throwError(() => ({ error: errorMessage }));
  }
}
```

### 4. HTTP Interceptor (interceptors/auth.interceptor.ts)
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

### 5. Route Guard (guards/auth.guard.ts)
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

## Build and Deployment

### 1. Docker Configuration

#### Frontend Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/volleyball-coach-client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
USER node
CMD ["node", "index.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: coach_app
      POSTGRES_USER: coach_app_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"

  backend:
    build: ./server
    environment:
      NODE_ENV: production
      DB_HOST: database
      DB_NAME: coach_app
      DB_USER: coach_app_user
      DB_PASSWORD: secure_password
      JWT_SECRET: your_production_jwt_secret
    depends_on:
      - database
    ports:
      - "3002:3002"

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

This technical specification provides everything needed to rebuild the Volleyball Coach App with a clean, professional structure. Each section includes complete, production-ready code that follows best practices.
