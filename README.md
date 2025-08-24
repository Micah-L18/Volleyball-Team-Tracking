# 🏐 Volleyball Team Tracking System (aka new portal volleyball)

A comprehensive web application for volleyball coaches to manage teams, track player development, and analyze performance metrics. Built with Angular, Node.js, and PostgreSQL.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure user registration and login
- Role-based access control (Head Coach, Assistant Coach)
- JWT token authentication
- Team-based permissions

### 👥 Team Management
- Create and manage multiple teams
- Add/remove players with detailed profiles
- Player roster management
- Team statistics and overviews

### ⭐ Advanced Skill Rating System
- **47 volleyball skills** across 7 categories:
  - Serving (Float, Jump, Topspin, Placement)
  - Passing (Reception, Digging, Platform)
  - Setting (Hand positioning, Footwork, Decision making)
  - Attacking (Power, Placement, Approach timing)
  - Blocking (Positioning, Timing, Hands)
  - Movement (Agility, Court awareness, Transitions)
  - Mental (Focus, Communication, Game sense)

- **Interactive Star Rating System**:
  - 5-star rating scale with half-star precision
  - Visual feedback with hover states
  - Single-click for whole stars, double-click for half-stars
  - Real-time updates and calculations

### 📊 Analytics & Insights
- Individual player skill profiles
- Team skill averages and comparisons
- Category-based performance breakdowns
- Progress tracking over time
- Export capabilities for reports

### 🎯 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean interface built with Tailwind CSS
- **Multiple View Modes**: Category view and list view for skills
- **Bulk Operations**: Rate multiple skills efficiently
- **Search & Filter**: Quick access to players and skills
- **Real-time Updates**: Instant feedback and calculations

## 🛠️ Technology Stack

### Frontend
- **Angular 18** - Modern web framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **RxJS** - Reactive programming

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Development Tools
- **Angular CLI** - Development tooling
- **nodemon** - Auto-restart development server
- **dotenv** - Environment configuration

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Micah-L18/Volleyball-Team-Tracking.git
   cd Volleyball-Team-Tracking
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb volleyball_coach_db
   
   # Run database initialization script
   cd server
   node scripts/init-db.js
   ```

3. **Configure environment variables**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env
   
   # Edit .env file with your database credentials
   nano server/.env
   ```

4. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

5. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev
   
   # Terminal 2: Start frontend server
   cd client
   ng serve
   ```

7. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3002

## 📁 Project Structure

```
volleyball-team-tracking/
├── client/                     # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # API services
│   │   │   ├── guards/         # Route guards
│   │   │   └── interfaces/     # TypeScript interfaces
│   │   └── environments/       # Environment configs
│   └── package.json
├── server/                     # Node.js backend
│   ├── routes/                 # API route handlers
│   ├── models/                 # Database models
│   ├── middleware/             # Custom middleware
│   ├── scripts/                # Database scripts
│   └── package.json
├── PreDocs/                    # Project documentation
│   ├── REBUILD_ROADMAP.md      # Development roadmap
│   ├── TECHNICAL_SPECIFICATION.md
│   └── DEVELOPER_ONBOARDING_GUIDE.md
└── README.md
```

## 🎮 Usage Guide

### Getting Started

1. **Register as a Coach**
   - Sign up with email and password
   - Create your first team
   - Set up team details and preferences

2. **Add Players**
   - Navigate to Team Management
   - Add players with their information
   - Assign jersey numbers and positions

3. **Rate Player Skills**
   - Select a player from your roster
   - Choose from 47 volleyball skills
   - Use star ratings (1-5 with half-star precision)
   - Add notes for specific feedback

4. **Track Progress**
   - View individual player skill profiles
   - Monitor team averages and improvements
   - Export reports for team meetings

### Key Features

#### Skill Rating System
- **Single-click**: Full star rating (1, 2, 3, 4, or 5 stars)
- **Double-click**: Half-star rating (0.5, 1.5, 2.5, 3.5, or 4.5 stars)
- **Bulk Rating**: Rate multiple skills at once
- **Category View**: Skills organized by volleyball categories
- **List View**: Searchable and sortable skill list

#### Team Analytics
- Overall team skill averages
- Category-specific performance metrics
- Player comparison tools
- Progress tracking over time
- Exportable reports

## 🔧 Development

### Environment Setup

```bash
# Backend environment variables (.env)
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volleyball_coach_db
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:4200
```

### Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - Coach accounts and authentication
- `teams` - Team information and settings
- `players` - Player profiles and details
- `volleyball_skills` - Skill definitions and categories
- `skill_ratings` - Player skill assessments
- `team_users` - Team membership and roles

### API Documentation

#### Authentication Endpoints
- `POST /api/auth/register` - Register new coach
- `POST /api/auth/login` - Coach login
- `GET /api/auth/verify` - Verify JWT token

#### Team Management
- `GET /api/teams` - Get coach's teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team

#### Player Management
- `GET /api/players/team/:teamId` - Get team players
- `POST /api/players` - Add new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Remove player

#### Skill Rating System
- `GET /api/skill-ratings/skills` - Get all skills
- `GET /api/skill-ratings/player/:playerId` - Get player ratings
- `PUT /api/skill-ratings/player/:playerId/skill/:skillName` - Update skill rating
- `POST /api/skill-ratings/player/:playerId/bulk-update` - Bulk rating update
- `GET /api/skill-ratings/team/:teamId/averages` - Team skill averages

## 🧪 Testing

### Manual Testing
Run the application and test key workflows:
- User registration and authentication
- Team and player management
- Skill rating functionality
- Analytics and reporting

### Database Testing
```bash
# Test database connection
cd server
node -e "require('./models/db').query('SELECT NOW()').then(r => console.log('DB Connected:', r.rows[0]))"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Test new features thoroughly
- Update documentation as needed

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Volleyball coaching community for feature inspiration
- Open source contributors and maintainers
- Angular and Node.js communities

## 📞 Support

For support, email micah.dev.lloyd@gmail.com or create an issue on GitHub.

---

**Made with ❤️ for volleyball coaches worldwide**

*Track progress, build champions* 🏆

