# Volleyball Coach Assistant App - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Features](#current-features)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Development Roadmap](#development-roadmap)
9. [Setup Instructions](#setup-instructions)
10. [Best Practices & Guidelines](#best-practices--guidelines)

## Project Overview

The Volleyball Coach Assistant App is a comprehensive web application designed to help volleyball coaches manage their teams, track player performance, and analyze team dynamics. The app provides tools for roster management, skill assessment, performance tracking, and schedule management.

### Key Objectives
- **Player Management**: Complete player profiles with physical attributes, contact info, and academic details
- **Skill Assessment**: Comprehensive rating system across Technical, Physical, Mental, and Tactical categories
- **Performance Analytics**: Team-wide insights with strength analysis and development priorities
- **Schedule Management**: Event tracking for practices, scrimmages, games, and tournaments
- **User Experience**: Intuitive tab-based interface with responsive design

## Current Features

### ✅ Implemented Features

#### 1. Authentication System
- **Login/Registration**: Secure JWT-based authentication
- **Coach Profiles**: Individual coach accounts with team management
- **Session Management**: Persistent login with token-based security
- **User Roles**: Multi-tier access control (Viewers, Players, Coaches)

#### 2. Team Management & Access Control
- **Team Creation**: Multiple teams per coach with customizable details
- **Team Dashboard**: Overview of all teams with quick navigation
- **Team Details**: Level, season, description, and photo support
- **User Invitations**: Invite viewers, players, and coaches to teams
- **Access Permissions**: Role-based access to team data and functionality

#### 3. User Role Management
- **Viewers**: Read-only access to team rosters, schedules, and basic stats
- **Players**: Can view their own data, add comments to notes, and see development plans
- **Coaches**: Full access to edit metrics, leave notes, manage players, and view all data
- **Team Invitations**: Send email invitations with role-specific access links

#### 4. Player Management
- **Complete Player Profiles**:
  - Basic info (name, position, year, jersey number)
  - Physical attributes (height, reach, dominant hand)
  - Contact information and academic details
  - Profile photos and notes
  - Player comments on coaching notes (player role only)
- **CRUD Operations**: Create, read, update, delete players
- **Search & Filter**: Real-time search by name, position, or year
- **Player Self-Access**: Players can view their own profiles and development plans

#### 5. Skill Rating System
- **Comprehensive Categories**:
  - **Technical**: Serving, passing, setting, spiking, blocking
  - **Physical**: Strength, agility, endurance, vertical jump, flexibility
  - **Mental**: Focus, leadership, communication, mental toughness
  - **Tactical**: Court positioning, decision making, game strategy
- **Rating Scale**: 1-5 star system with 0.5 increments
- **Overall Calculations**: Automatic calculation of player overall ratings
- **Visual Display**: Star ratings with numerical scores
- **Video Attachments**: Attach video clips to individual skill ratings and notes
- **Coach-Only Editing**: Only coaches can modify skill ratings

#### 6. Enhanced Development & Notes System
- **Development Plans**: Detailed improvement goals with video demonstrations
- **Progress Tracking**: Track skill development over time with timestamps
- **Video Integration**: Attach instructional or example videos to notes
- **Interactive Comments**: Players can comment on coaching notes and development plans
- **File Management**: Organized storage and retrieval of video content

#### 7. Statistics & Analytics System
- **Individual Player Stats**: 
  - Performance metrics by skill category
  - Progress tracking over time
  - Comparative analysis with team averages
  - Export individual stat reports
- **Team Statistics**:
  - Comprehensive team performance analytics
  - Skill category breakdowns and comparisons
  - Historical team development tracking
  - Season-over-season comparisons
- **Import/Export Functionality**:
  - Import existing player statistics from CSV/Excel
  - Export team and individual reports in multiple formats
  - Statistical data backup and restore
- **Advanced Analytics**: Predictive insights and trend analysis

#### 8. Team Analytics Dashboard
- **Skill Dashboard**: Comprehensive team performance overview
- **Insights Panel**: 
  - **Top Strengths**: Team's highest-rated skills
  - **Well-balanced Skills**: Consistent performance areas
  - **Priority Development**: Areas needing improvement
- **Category Breakdowns**: Performance analysis by skill category
- **Statistical Visualization**: Charts and graphs for data representation

#### 9. Schedule Management
- **Event Types**: Practices, scrimmages, games, tournaments
- **Event Details**: Date, time, location, opponent (for games/scrimmages)
- **CRUD Operations**: Full event management capabilities
- **Tab Interface**: Integrated with roster in clean tab layout
- **Role-Based Viewing**: All user types can view schedules

#### 10. User Interface
- **Tailwind CSS**: Modern, utility-first CSS framework for responsive design
- **Custom Components**: Clean, accessible UI components built with Tailwind
- **Tab Navigation**: Clean separation of roster and schedule views
- **Responsive Layout**: Mobile-friendly design with touch optimization
- **Intuitive Navigation**: Dropdown team selection with integrated "New Team" option
- **Role-Based UI**: Interface adapts based on user permissions

### 🚧 Partially Implemented
- **Video Integration**: Basic video attachment to notes and development focuses
- **Statistics Import/Export**: Basic CSV import/export functionality
- **User Role Management**: Role-based access control system
- **Team Invitations**: Email-based team member invitations

### 🔮 Planned Features
- **Advanced Video Analytics**: Video analysis tools for skill improvement
- **Mobile Application**: Native iOS and Android apps
- **Advanced Statistics**: Machine learning-powered performance predictions
- **Tournament Management**: Multi-team tournament organization tools

## Architecture & Technology Stack

### Frontend
- **Framework**: Angular 18 (Standalone Components)
- **UI Library**: Tailwind CSS with Angular integration
- **Styling**: Tailwind CSS utility classes with custom components
- **HTTP Client**: Angular HttpClient with interceptors
- **State Management**: Component-based state with services
- **Routing**: Angular Router with route guards
- **Video Support**: HTML5 video player with file upload

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Cross-origin resource sharing enabled
- **Environment**: dotenv for configuration
- **File Storage**: Multer for video/image uploads
- **Statistics**: Custom analytics engine for player/team stats

### Database
- **System**: PostgreSQL
- **Connection**: pg (node-postgres) connection pooling
- **Schema**: Relational design with foreign key constraints
- **Migrations**: SQL scripts for table creation
- **File Storage**: Database references to file system paths

## Project Structure

```
volleyball-coach-app/
├── client/                          # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/          # UI Components
│   │   │   │   ├── roster/          # Main roster management
│   │   │   │   ├── team-skill-dashboard/ # Analytics dashboard
│   │   │   │   ├── team-schedule/   # Schedule management
│   │   │   │   └── player-form/     # Player creation/editing
│   │   │   ├── dialogs/             # Modal dialogs
│   │   │   │   ├── player-dialog.component.ts
│   │   │   │   ├── team-dialog.component.ts
│   │   │   │   └── schedule-dialog.component.ts
│   │   │   ├── services/            # Business logic services
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── team.service.ts
│   │   │   │   ├── player.service.ts
│   │   │   │   └── skill-rating.service.ts
│   │   │   ├── models/              # TypeScript interfaces
│   │   │   │   └── types.ts
│   │   │   ├── guards/              # Route protection
│   │   │   └── interceptors/        # HTTP interceptors
│   │   └── assets/                  # Static assets
│   ├── package.json
│   └── angular.json
├── server/                          # Node.js Backend
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                  # Authentication routes
│   │   ├── teams.js                 # Team management
│   │   ├── players.js               # Player operations
│   │   ├── skill-ratings.js         # Skill rating CRUD
│   │   └── development.js           # Development plans
│   ├── models/                      # Database models
│   │   └── db.js                    # Database connection
│   ├── middleware/                  # Express middleware
│   │   └── auth.js                  # JWT verification
│   ├── scripts/                     # Database utilities
│   │   ├── init-db.js              # Database initialization
│   │   └── add-teams.js            # Schema updates
│   ├── create-elite-team.js         # Test data generation
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── index.js                     # Server entry point
└── README.md
```

## Database Schema

### Core Tables

#### `coach` Table
```sql
CREATE TABLE coach (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `team` Table
```sql
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
```

#### `team_users` Table
```sql
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
```

#### `player` Table
```sql
CREATE TABLE player (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50),
  year VARCHAR(30),
  jersey_number INTEGER,
  height VARCHAR(20),
  reach VARCHAR(20),
  dominant_hand VARCHAR(10),
  contact_info VARCHAR(255),
  notes TEXT,
  photo_url VARCHAR(500),
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `volleyball_skills` Table
```sql
CREATE TABLE volleyball_skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `skill_ratings` Table
```sql
CREATE TABLE skill_ratings (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  skill_category VARCHAR(50) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  rated_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `development_areas` Table
```sql
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
```

#### `video_attachments` Table
```sql
CREATE TABLE video_attachments (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES coach(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `note_videos` Table
```sql
CREATE TABLE note_videos (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES video_attachments(id) ON DELETE CASCADE,
  note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('skill_rating', 'development_area', 'general_note')),
  reference_id INTEGER, -- Links to skill_ratings.id or development_areas.id
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `player_comments` Table
```sql
CREATE TABLE player_comments (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('skill_rating', 'development_area', 'general_note')),
  reference_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `player_statistics` Table
```sql
CREATE TABLE player_statistics (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL,
  stat_name VARCHAR(100) NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,
  stat_date DATE NOT NULL,
  game_type VARCHAR(50), -- 'practice', 'scrimmage', 'game', 'tournament'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `team_statistics` Table
```sql
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
```

### Relationships
- **One-to-Many**: Coach → Teams → Players
- **One-to-Many**: Player → Skill Ratings
- **One-to-Many**: Player → Development Areas
- **One-to-Many**: Player → Comments
- **One-to-Many**: Player → Statistics
- **One-to-Many**: Team → Statistics
- **One-to-Many**: Team → User Invitations
- **Many-to-Many**: Players ↔ Volleyball Skills (through skill_ratings)
- **Many-to-Many**: Notes ↔ Videos (through note_videos)
- **Many-to-One**: Team Users → Teams (role-based access)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - Coach login with email/password
- `POST /register` - New coach registration
- `POST /logout` - Session termination

### Teams (`/api/teams`)
- `GET /` - Get all teams for authenticated user (role-based)
- `GET /:id` - Get specific team details (with role-based data)
- `POST /` - Create new team (coaches only)
- `PUT /:id` - Update team information (coaches only)
- `DELETE /:id` - Delete team and all associated data (team coach only)

### Team Access (`/api/team-access`)
- `POST /:teamId/invite` - Invite user to team with specific role
- `GET /:teamId/users` - Get all team users and their roles
- `PUT /:teamId/users/:userId` - Update user role (coaches only)
- `DELETE /:teamId/users/:userId` - Remove user from team (coaches only)
- `POST /accept-invitation` - Accept team invitation

### Players (`/api/players`)
- `GET /team/:teamId` - Get all players for a team (role-based access)
- `GET /:id` - Get specific player details (role-based access)
- `POST /` - Create new player (coaches only)
- `PUT /:id` - Update player information (coaches only)
- `DELETE /:id` - Delete player and all associated data (coaches only)

### Player Comments (`/api/player-comments`)
- `GET /player/:playerId` - Get comments for a player
- `POST /player/:playerId` - Add comment to player note (players can comment on their own notes)
- `PUT /:commentId` - Update comment (comment author only)
- `DELETE /:commentId` - Delete comment (comment author or coaches only)

### Skill Ratings (`/api/skill-ratings`)
- `GET /skills` - Get all available volleyball skills
- `GET /player/:playerId` - Get all ratings for a player (role-based access)
- `PUT /player/:playerId/skill/:skillName` - Update/create skill rating (coaches only)
- `DELETE /player/:playerId/skill/:skillName` - Remove skill rating (coaches only)
- `GET /team/:teamId/averages` - Get team skill averages

### Video Attachments (`/api/videos`)
- `POST /upload` - Upload video file (coaches only)
- `GET /:videoId` - Get video file (role-based access)
- `POST /attach` - Attach video to note or development area (coaches only)
- `GET /note/:noteId` - Get videos attached to specific note
- `DELETE /:videoId` - Delete video and all attachments (coaches only)

### Statistics (`/api/statistics`)
- `GET /player/:playerId` - Get player statistics (role-based access)
- `POST /player/:playerId` - Add player statistic (coaches only)
- `GET /team/:teamId` - Get team statistics (role-based access)
- `POST /team/:teamId` - Add team statistic (coaches only)
- `POST /import` - Import statistics from CSV/Excel (coaches only)
- `GET /export/player/:playerId` - Export player stats
- `GET /export/team/:teamId` - Export team stats

### Development (`/api/development`)
- `GET /player/:playerId` - Get development areas for player
- `POST /player/:playerId` - Create development area
- `PUT /:id` - Update development area
- `DELETE /:id` - Remove development area

## Frontend Components

### Core Components

#### `RosterComponent`
**Location**: `client/src/app/components/roster/`
**Purpose**: Main team management interface with tabbed layout
**Features**:
- Player grid display with photos and ratings
- Search and filter functionality
- Tab navigation (Roster/Schedule)
- Team analytics toggle
- CRUD operations for players

#### `TeamSkillDashboardComponent`
**Location**: `client/src/app/components/team-skill-dashboard/`
**Purpose**: Team performance analytics and insights
**Features**:
- Skill category breakdowns
- Top strengths identification
- Well-balanced skills analysis
- Priority development areas
- Visual charts and progress indicators

#### `TeamScheduleComponent`
**Location**: `client/src/app/components/team-schedule/`
**Purpose**: Event and schedule management
**Features**:
- Event creation (practices, games, tournaments)
- Calendar view and list view
- Event filtering by type
- Opponent tracking for competitive events

#### `PlayerDialogComponent`
**Location**: `client/src/app/dialogs/player-dialog.component.ts`
**Purpose**: Player creation and editing modal
**Features**:
- Complete player profile form
- Photo upload capability
- Physical attributes input
- Form validation and error handling

### Services

#### `AuthService`
**Purpose**: Authentication and session management
**Methods**:
- `login()`, `logout()`, `register()`
- `isLoggedIn()`, `getToken()`, `getCurrentUser()`

#### `TeamService`
**Purpose**: Team data operations
**Methods**:
- `getAllTeams()`, `getTeam()`, `createTeam()`, `updateTeam()`, `deleteTeam()`

#### `PlayerService`
**Purpose**: Player data operations
**Methods**:
- `getTeamPlayers()`, `getPlayer()`, `createPlayer()`, `updatePlayer()`, `deletePlayer()`

#### `SkillRatingService`
**Purpose**: Skill rating management and calculations
**Methods**:
- `getPlayerSkillRatings()`, `updateSkillRating()`, `deleteSkillRating()`
- `calculateOverallScore()`, `getTeamSkillAverages()`

## Development Roadmap

### Phase 1: Foundation & Core Features ✅
- [x] Project setup and architecture
- [x] Authentication system
- [x] Basic team and player management
- [x] Database schema design
- [x] API structure

### Phase 2: Skill Management ✅
- [x] Comprehensive skill rating system
- [x] Rating calculations and analytics
- [x] Team performance dashboard
- [x] Player overall ratings display

### Phase 3: Enhanced UI/UX ✅
- [x] Material Design implementation
- [x] Responsive layout
- [x] Tab-based navigation
- [x] Schedule management interface
- [x] Improved team navigation

### Phase 4: Advanced Features 🚧
- [ ] **Progress Tracking**: Historical skill development over time
- [ ] **Comparison Tools**: Player-to-player and team-to-team comparisons
- [ ] **Advanced Analytics**: Trend analysis and predictive insights
- [ ] **Export Capabilities**: PDF reports and data export
- [ ] **Mobile App**: Native mobile application

### Phase 5: Professional Features 🔮
- [ ] **Video Integration**: Skill demonstration videos
- [ ] **Game Statistics**: Match performance tracking
- [ ] **Parent Portal**: Limited access for player families
- [ ] **League Management**: Multi-team tournament organization
- [ ] **AI Insights**: Machine learning performance recommendations

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)
- Angular CLI (v18+)
- Git

### Database Setup
1. **Install PostgreSQL** and create database:
   ```sql
   CREATE DATABASE coach_app;
   CREATE USER micahlloyd WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE coach_app TO micahlloyd;
   ```

2. **Initialize Database Schema**:
   ```bash
   cd server
   node scripts/init-db.js
   ```

### Backend Setup
1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**:
   ```bash
   # Create .env file
   NODE_ENV=development
   PORT=3002
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=coach_app
   DB_USER=micahlloyd
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

### Frontend Setup
1. **Install Dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

### Test Data Creation
```bash
cd server
node create-elite-team.js  # Creates comprehensive test team
```

## Best Practices & Guidelines

### Code Organization
1. **Component Structure**: Use Angular standalone components for better tree-shaking
2. **Service Injection**: Implement dependency injection for testability
3. **Type Safety**: Comprehensive TypeScript interfaces for all data models
4. **Error Handling**: Consistent error handling across API and frontend

### Database Best Practices
1. **Normalization**: Properly normalized schema with foreign key constraints
2. **Indexing**: Index frequently queried columns (team_id, player_id)
3. **Validation**: Database-level constraints for data integrity
4. **Transactions**: Use transactions for multi-table operations

### API Design
1. **RESTful**: Follow REST conventions for endpoint design
2. **Authentication**: JWT middleware for protected routes
3. **Validation**: Input validation using express-validator
4. **Error Responses**: Consistent error response format

### Frontend Architecture
1. **Reactive Programming**: Use RxJS observables for async operations
2. **Component Communication**: Parent-child communication via @Input/@Output
3. **State Management**: Service-based state for shared data
4. **Lazy Loading**: Route-based code splitting for performance

### Security Considerations
1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Security**: Secure token storage and expiration
3. **Input Sanitization**: Prevent SQL injection and XSS
4. **CORS Configuration**: Properly configured cross-origin requests

### Performance Optimization
1. **Database Queries**: Efficient queries with proper joins
2. **Caching**: Service-level caching for frequently accessed data
3. **Bundle Size**: Tree-shaking and lazy loading
4. **Image Optimization**: Compressed images and proper sizing

### Testing Strategy
1. **Unit Tests**: Component and service testing with Jasmine/Karma
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Full user workflow testing with Cypress
4. **Performance Tests**: Load testing for API endpoints

---

## Quick Start Checklist

For a new developer joining the project:

### Day 1: Environment Setup
- [ ] Clone repository
- [ ] Install PostgreSQL and create database
- [ ] Set up backend environment variables
- [ ] Run database initialization script
- [ ] Start backend server
- [ ] Install frontend dependencies
- [ ] Start frontend development server
- [ ] Create test data and verify functionality

### Day 2: Code Familiarization
- [ ] Review database schema and relationships
- [ ] Explore API endpoints with Postman/curl
- [ ] Navigate frontend components and services
- [ ] Understand authentication flow
- [ ] Review skill rating system logic

### Day 3: Feature Development
- [ ] Choose a feature from the roadmap
- [ ] Create feature branch
- [ ] Implement backend API changes
- [ ] Update frontend components
- [ ] Test integration end-to-end
- [ ] Submit pull request

This documentation provides a comprehensive foundation for rebuilding the application cleanly and efficiently. Each section contains the necessary details for developers to understand the current state and continue development effectively.
