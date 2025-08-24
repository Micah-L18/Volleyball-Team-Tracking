# Step-by-Step Rebuild Guide - Volleyball Coach App

## Claude AI Implementation Roadmap

This guide provides a systematic approach for rebuilding the Volleyball Coach App with clean architecture and best practices.

## Phase 1: Project Foundation (Day 1)

### Step 1.1: Project Structure Setup
```bash
# Create project directory
mkdir volleyball-coach-app
cd volleyball-coach-app

# Initialize backend
mkdir server
cd server
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken pg express-validator

# Initialize frontend
cd ..
npx @angular/cli@latest new client --routing --style=scss --standalone
cd client
npm install tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
npm install
```

### Step 1.2: Database Setup
1. **Install PostgreSQL** (if not already installed)
2. **Create database and user** using SQL from Technical Specification
3. **Create and run `scripts/init-db.js`** with complete schema
4. **Populate initial skill data** using volleyball_skills INSERT statements

### Step 1.3: Backend Foundation
1. **Environment Configuration**: Create `.env` file with all required variables
2. **Database Connection**: Implement `models/db.js` with connection pooling
3. **Authentication Middleware**: Create `middleware/auth.js` with JWT verification
4. **File Upload Middleware**: Set up Multer for video file handling
5. **Main Server**: Implement `index.js` with middleware and route setup
6. **Test Connection**: Verify database connection and server startup

### Step 1.4: Frontend Foundation
1. **Tailwind Configuration**: Set up Tailwind CSS with custom design system
2. **HTTP Interceptor**: Implement authentication interceptor
3. **Route Guard**: Create auth guard for protected routes
4. **Basic Routing**: Set up main application routes with role-based access
5. **Test Setup**: Verify Angular development server

## Phase 2: Authentication System (Day 2)

### Step 2.1: Backend Authentication
```javascript
// routes/auth.js - Complete implementation
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if coach already exists
    const existingCoach = await pool.query('SELECT id FROM coach WHERE email = $1', [email]);
    if (existingCoach.rows.length > 0) {
      return res.status(400).json({ error: 'Coach already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create coach
    const result = await pool.query(
      'INSERT INTO coach (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    const coach = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: coach.id, email: coach.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      coach
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { email, password } = req.body;

    // Find coach
    const result = await pool.query('SELECT * FROM coach WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const coach = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, coach.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: coach.id, email: coach.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      coach: {
        id: coach.id,
        email: coach.email,
        name: coach.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### Step 2.2: Frontend Authentication
1. **Auth Service**: Complete implementation with login/register methods
2. **Login Component**: Create login form with validation
3. **Register Component**: Create registration form
4. **Auth Interceptor**: Automatic token attachment
5. **Route Protection**: Implement auth guard

### Step 2.3: Testing Authentication
1. **Test Registration**: Create new coach account
2. **Test Login**: Verify token generation and storage
3. **Test Protected Routes**: Ensure auth guard works
4. **Test Token Expiration**: Handle expired tokens

## Phase 3: Team Management (Day 3)

### Step 3.1: Backend Team Operations
```javascript
// routes/teams.js - Key endpoints
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all teams for coach
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team WHERE coach_id = $1 ORDER BY created_at DESC',
      [req.coach.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create new team
router.post('/', authMiddleware, [
  body('name').trim().isLength({ min: 1 }).withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, level, season, description, photo_url } = req.body;

    const result = await pool.query(
      `INSERT INTO team (name, level, season, description, photo_url, coach_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, level, season, description, photo_url, req.coach.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

module.exports = router;
```

### Step 3.2: Frontend Team Management
1. **Team Service**: CRUD operations for teams
2. **Team List Component**: Display all teams
3. **Team Dialog**: Create/edit team modal
4. **Team Navigation**: Dropdown team selector
5. **Team Dashboard**: Basic team overview

## Phase 4: Player Management (Day 4)

### Step 4.1: Backend Player Operations
```javascript
// routes/players.js - Complete CRUD
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get players for a team
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team belongs to coach
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND coach_id = $2',
      [teamId, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM player WHERE team_id = $1 ORDER BY jersey_number, name',
      [teamId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Create new player
router.post('/', authMiddleware, [
  body('name').trim().isLength({ min: 1 }).withMessage('Player name is required'),
  body('team_id').isInt().withMessage('Valid team ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      name, position, year, jersey_number, height, reach,
      dominant_hand, contact_info, notes, photo_url, team_id
    } = req.body;

    // Verify team belongs to coach
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND coach_id = $2',
      [team_id, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `INSERT INTO player (
        name, position, year, jersey_number, height, reach,
        dominant_hand, contact_info, notes, photo_url, team_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [name, position, year, jersey_number, height, reach,
       dominant_hand, contact_info, notes, photo_url, team_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

module.exports = router;
```

### Step 4.2: Frontend Player Management
1. **Player Service**: Complete CRUD operations
2. **Player Dialog**: Enhanced form with all attributes
3. **Player Grid**: Display players with photos and ratings
4. **Player Search**: Real-time filtering
5. **Player Details**: Individual player view

## Phase 5: Skill Rating System (Day 5-6)

### Step 5.1: Backend Skill Operations
```javascript
// routes/skill-ratings.js - Core functionality
const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all volleyball skills
router.get('/skills', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM volleyball_skills ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Get player skill ratings
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify player belongs to coach's team
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.id = $1 AND t.coach_id = $2
    `, [playerId, req.coach.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM skill_ratings WHERE player_id = $1 ORDER BY skill_category, skill_name',
      [playerId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skill ratings:', error);
    res.status(500).json({ error: 'Failed to fetch skill ratings' });
  }
});

// Update/create skill rating
router.put('/player/:playerId/skill/:skillName', authMiddleware, async (req, res) => {
  try {
    const { playerId, skillName } = req.params;
    const { rating, notes, rated_date } = req.body;

    // Validation
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    // Verify access
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.id = $1 AND t.coach_id = $2
    `, [playerId, req.coach.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get skill details
    const skillResult = await pool.query(
      'SELECT category, description FROM volleyball_skills WHERE name = $1',
      [skillName]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skill = skillResult.rows[0];

    // Upsert skill rating
    const result = await pool.query(`
      INSERT INTO skill_ratings (
        player_id, skill_category, skill_name, skill_description,
        rating, notes, rated_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (player_id, skill_name)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        notes = EXCLUDED.notes,
        rated_date = EXCLUDED.rated_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [playerId, skill.category, skillName, skill.description, rating, notes, rated_date]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating skill rating:', error);
    res.status(500).json({ error: 'Failed to update skill rating' });
  }
});

module.exports = router;
```

### Step 5.2: Frontend Skill System
1. **Skill Rating Service**: Complete rating operations and calculations
2. **Skill Rating Dialog**: Individual skill rating form
3. **Player Rating Display**: Star ratings and numerical scores
4. **Bulk Rating Interface**: Rate multiple skills efficiently
5. **Rating History**: Track rating changes over time

## Phase 6: Analytics Dashboard (Day 7)

### Step 6.1: Backend Analytics
```javascript
// Team skill averages endpoint
router.get('/team/:teamId/averages', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND coach_id = $2',
      [teamId, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT 
        sr.skill_name,
        sr.skill_category,
        ROUND(AVG(sr.rating), 1) as average_rating,
        COUNT(sr.rating) as player_count
      FROM skill_ratings sr
      JOIN player p ON sr.player_id = p.id
      WHERE p.team_id = $1
      GROUP BY sr.skill_name, sr.skill_category
      ORDER BY sr.skill_category, average_rating DESC
    `, [teamId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team averages:', error);
    res.status(500).json({ error: 'Failed to fetch team averages' });
  }
});
```

### Step 6.2: Frontend Analytics
1. **Team Skill Dashboard**: Comprehensive analytics component
2. **Insights Panel**: Top strengths, balanced skills, priorities
3. **Category Breakdown**: Performance by skill category
4. **Visual Charts**: Charts and graphs for data visualization
5. **Export Functionality**: PDF reports and data export

## Phase 7: Schedule Management (Day 8)

### Step 7.1: Backend Schedule Operations
```javascript
// routes/schedule.js - Event management
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get team schedule
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND coach_id = $2',
      [teamId, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM schedule_events WHERE team_id = $1 ORDER BY event_date, start_time',
      [teamId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Create schedule event
router.post('/', authMiddleware, [
  body('team_id').isInt(),
  body('event_type').isIn(['Practice', 'Scrimmage', 'Game', 'Tournament']),
  body('title').trim().isLength({ min: 1 }),
  body('event_date').isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      team_id, event_type, title, description, event_date,
      start_time, end_time, location, opponent
    } = req.body;

    // Verify team access
    const teamCheck = await pool.query(
      'SELECT id FROM team WHERE id = $1 AND coach_id = $2',
      [team_id, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      INSERT INTO schedule_events (
        team_id, event_type, title, description, event_date,
        start_time, end_time, location, opponent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [team_id, event_type, title, description, event_date,
        start_time, end_time, location, opponent]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating schedule event:', error);
    res.status(500).json({ error: 'Failed to create schedule event' });
  }
});

module.exports = router;
```

### Step 7.2: Frontend Schedule Management
1. **Schedule Service**: Event CRUD operations
2. **Team Schedule Component**: Calendar and list views
3. **Schedule Dialog**: Event creation/editing form
4. **Event Filtering**: Filter by type, date range
5. **Calendar Integration**: Visual calendar display

## Phase 8: User Role Management & Invitations (Day 8)

### Step 8.1: Backend User Management
```javascript
// routes/team-access.js - User invitation system
const express = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Invite user to team
router.post('/:teamId/invite', authMiddleware, [
  body('user_email').isEmail().normalizeEmail(),
  body('role').isIn(['viewer', 'player', 'coach']),
  body('user_name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { teamId } = req.params;
    const { user_email, user_name, role, player_id, message } = req.body;

    // Verify team ownership for coach role or team access for other roles
    const teamCheck = await pool.query(
      'SELECT * FROM team WHERE id = $1 AND coach_id = $2',
      [teamId, req.coach.id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user already invited
    const existingInvite = await pool.query(
      'SELECT id FROM team_users WHERE team_id = $1 AND user_email = $2',
      [teamId, user_email]
    );

    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ error: 'User already invited to this team' });
    }

    // Create invitation
    const result = await pool.query(`
      INSERT INTO team_users (team_id, user_email, user_name, role, player_id, invited_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [teamId, user_email, user_name, role, player_id, req.coach.id]);

    // Send invitation email (implement email service)
    // await sendInvitationEmail(user_email, teamCheck.rows[0], role, message);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

module.exports = router;
```

### Step 8.2: Frontend Role Management
1. **Team Access Service**: Invitation and role management operations
2. **Invitation Dialog**: Send invitations with role selection
3. **User Management Panel**: View and manage team users
4. **Role-Based UI**: Adaptive interface based on user permissions
5. **Accept Invitation Flow**: Landing page for invitation acceptance

## Phase 9: Video Integration System (Day 9)

### Step 9.1: Backend Video Handling
```javascript
// routes/videos.js - Video upload and management
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  }
});

// Upload video
router.post('/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { filename, originalname, size, mimetype, path: filePath } = req.file;

    const result = await pool.query(`
      INSERT INTO video_attachments (file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [originalname, filePath, size, mimetype, req.coach.id]);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Attach video to note
router.post('/attach', authMiddleware, async (req, res) => {
  try {
    const { player_id, video_id, note_type, reference_id, description } = req.body;

    // Verify player access
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.id = $1 AND t.coach_id = $2
    `, [player_id, req.coach.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      INSERT INTO note_videos (player_id, video_id, note_type, reference_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [player_id, video_id, note_type, reference_id, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error attaching video:', error);
    res.status(500).json({ error: 'Failed to attach video' });
  }
});

module.exports = router;
```

### Step 9.2: Frontend Video Integration
1. **Video Upload Service**: File upload with progress tracking
2. **Video Player Component**: HTML5 video player with controls
3. **Video Attachment Dialog**: Attach videos to notes and development areas
4. **Video Gallery**: Browse and manage uploaded videos
5. **Note Enhancement**: Display attached videos in notes and development areas

## Phase 10: Statistics System (Day 10)

### Step 10.1: Backend Statistics Engine
```javascript
// routes/statistics.js - Statistics management
const express = require('express');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get player statistics
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify access to player
    const accessCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      LEFT JOIN team_users tu ON tu.team_id = t.id AND tu.user_email = $2
      WHERE p.id = $1 AND (t.coach_id = $3 OR tu.status = 'accepted')
    `, [playerId, req.user.email, req.coach?.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT * FROM player_statistics 
      WHERE player_id = $1 
      ORDER BY stat_date DESC, stat_category, stat_name
    `, [playerId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    res.status(500).json({ error: 'Failed to fetch player statistics' });
  }
});

// Import statistics from CSV/Excel
const upload = multer({ dest: 'uploads/temp/' });

router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { type, target_id } = req.body; // 'player' or 'team'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    if (fileExtension === '.csv') {
      // Parse CSV
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Process and insert data
    const insertPromises = data.map(row => {
      if (type === 'player') {
        return pool.query(`
          INSERT INTO player_statistics (player_id, stat_category, stat_name, stat_value, stat_date, game_type, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [target_id, row.category, row.name, row.value, row.date, row.game_type, row.notes]);
      } else {
        return pool.query(`
          INSERT INTO team_statistics (team_id, stat_category, stat_name, stat_value, stat_date, game_type, opponent, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [target_id, row.category, row.name, row.value, row.date, row.game_type, row.opponent, row.notes]);
      }
    });

    await Promise.all(insertPromises);

    // Clean up temp file
    fs.unlinkSync(filePath);

    res.json({ message: `Successfully imported ${data.length} statistics` });
  } catch (error) {
    console.error('Error importing statistics:', error);
    res.status(500).json({ error: 'Failed to import statistics' });
  }
});

module.exports = router;
```

### Step 10.2: Frontend Statistics System
1. **Statistics Service**: Complete statistics CRUD operations
2. **Statistics Dashboard**: Visual charts and graphs for player/team stats
3. **Import/Export Components**: File upload and download functionality
4. **Statistical Analysis**: Trend analysis and comparative statistics
5. **Report Generation**: Automated statistical reports

## Phase 11: Enhanced UI with Tailwind (Day 11)

### Step 11.1: Tailwind CSS Implementation
```css
/* tailwind.config.js */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Step 11.2: Component Redesign
1. **Design System**: Establish consistent Tailwind-based design tokens
2. **Component Library**: Create reusable UI components
3. **Form Styling**: Implement consistent form designs
4. **Navigation**: Redesign navigation with Tailwind
5. **Responsive Design**: Ensure mobile-first responsive design

## Phase 12: Testing & Quality Assurance (Day 12-13)

### Step 12.1: Comprehensive Testing
1. **Unit Tests**: Component and service testing with role-based access
2. **Integration Tests**: API endpoint testing with authentication
3. **E2E Tests**: Complete user workflows for all user roles
4. **Video Upload Tests**: File upload and streaming functionality
5. **Statistics Tests**: Import/export and calculation accuracy

### Step 12.2: Security & Performance
1. **Security Audit**: Role-based access control verification
2. **File Upload Security**: Video file validation and storage security
3. **Performance Testing**: Large file handling and database optimization
4. **Load Testing**: Multi-user concurrent access testing
5. **Mobile Testing**: Responsive design and touch interface testing

## Phase 13: Deployment & Production (Day 14-15)

### Step 13.1: Production Deployment
1. **Environment Setup**: Configure production servers with file storage
2. **Database Migration**: Run schema updates with new tables
3. **File Storage Configuration**: Set up video file storage and CDN
4. **Email Service**: Configure transactional email for invitations
5. **Monitoring**: Set up logging, error tracking, and performance monitoring

### Step 13.2: User Documentation
1. **Coach Guide**: Complete coaching features documentation
2. **Player Guide**: Player-specific features and capabilities
3. **Viewer Guide**: Read-only access documentation
4. **Admin Guide**: Team management and invitation system
5. **Video Guide**: Video upload and attachment workflows

## Enhanced Quality Assurance Checklist

### Role-Based Access Control
- [ ] Viewers can only read data, no editing capabilities
- [ ] Players can view their own data and comment on notes
- [ ] Coaches can edit all metrics and manage team members
- [ ] Team invitations work correctly for all role types
- [ ] Email notifications are sent properly

### Video Integration
- [ ] Video upload supports multiple formats (MP4, MOV, AVI, WebM)
- [ ] Video files are properly validated and stored securely
- [ ] Videos can be attached to notes and development areas
- [ ] Video playback works across different devices and browsers
- [ ] File size limits are enforced (100MB max)

### Statistics System
- [ ] CSV and Excel import functions work correctly
- [ ] Statistical calculations are accurate
- [ ] Export functionality produces correct formats
- [ ] Individual and team statistics are properly separated
- [ ] Historical data tracking maintains integrity

### User Interface
- [ ] Tailwind CSS implementation is consistent
- [ ] Components are responsive across all screen sizes
- [ ] Touch interfaces work properly on mobile devices
- [ ] Loading states provide appropriate feedback
- [ ] Error messages are user-friendly and actionable

### Performance & Security
- [ ] File uploads handle large videos efficiently
- [ ] Database queries are optimized with proper indexing
- [ ] JWT tokens are properly secured and refreshed
- [ ] Input validation prevents injection attacks
- [ ] Role-based endpoints properly verify permissions

This enhanced roadmap provides a complete implementation plan for all the requested features while maintaining code quality and security standards.
