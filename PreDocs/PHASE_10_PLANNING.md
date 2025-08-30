# Phase 10 Planning - Volleyball Coach App

## 📊 Phase 10: Statistics System

**Target Completion:** TBD  
**Prerequisites:** Phase 9 (Video Integration) - Skipped for now  
**Status:** Planning Phase  
**Estimated Duration:** 7-10 days

---

## 📋 Phase 10 Overview

Phase 10 focuses on implementing a comprehensive statistics system that allows coaches to track, import, analyze, and visualize player and team performance data. This system will provide powerful analytical tools for performance improvement and strategic decision-making.

---

## 📊 **Core Features - Statistics System**

### **10.1: Backend Statistics Engine**

#### **Statistics Database Schema**
- [ ] **Player Statistics Table**
  ```sql
  player_statistics: id, player_id, stat_category, stat_name, stat_value, 
                    stat_date, game_type, notes, created_at, updated_at
  ```
- [ ] **Team Statistics Table**
  ```sql
  team_statistics: id, team_id, stat_category, stat_name, stat_value,
                  stat_date, game_type, opponent, notes, created_at, updated_at
  ```

#### **Statistics API Endpoints**
- [ ] **GET /api/statistics/player/:playerId** - Get player statistics
- [ ] **GET /api/statistics/team/:teamId** - Get team statistics  
- [ ] **POST /api/statistics/player** - Add player statistics
- [ ] **POST /api/statistics/team** - Add team statistics
- [ ] **PUT /api/statistics/:id** - Update statistics record
- [ ] **DELETE /api/statistics/:id** - Delete statistics record
- [ ] **GET /api/statistics/categories** - Get available stat categories

#### **File Import System**
- [ ] **POST /api/statistics/import** - Import from CSV/Excel
- [ ] **CSV Parser Integration** - Process CSV files with csv-parser
- [ ] **Excel Parser Integration** - Process Excel files with xlsx library
- [ ] **Data Validation** - Validate imported statistical data
- [ ] **Bulk Insert Operations** - Efficiently process large datasets

#### **Advanced Statistics Queries**
- [ ] **Statistical Aggregations** - Calculate averages, totals, percentages
- [ ] **Time-based Filtering** - Filter stats by date ranges, seasons
- [ ] **Performance Trends** - Track performance changes over time
- [ ] **Comparative Analysis** - Compare players, teams, periods

### **10.2: Frontend Statistics System**

#### **Statistics Service**
- [ ] **Statistics Service** (statistics.service.ts)
  - CRUD operations for player/team statistics
  - File upload functionality for imports
  - Data aggregation and calculation methods
  - Export functionality for reports

#### **Statistics Dashboard**
- [ ] **Team Statistics Overview**
  - Key performance indicators (KPIs)
  - Team performance summary cards
  - Recent statistics trends
  - Season/game performance comparisons

#### **Player Statistics Components**
- [ ] **Individual Player Stats**
  - Comprehensive player statistical profile
  - Performance trends and graphs
  - Skill-specific statistics breakdown
  - Historical performance tracking

#### **Statistics Management Interface**
- [ ] **Add/Edit Statistics Form**
  - Manual statistics entry interface
  - Category and metric selection
  - Date and game type specification
  - Batch entry capabilities

#### **Import/Export Components**
- [ ] **File Import Interface**
  - Drag-and-drop file upload
  - CSV/Excel file validation
  - Import preview and confirmation
  - Error handling and feedback

- [ ] **Data Export Tools**
  - Export statistics to CSV/Excel
  - Customizable report generation
  - Date range and filter selection
  - Multiple format support (PDF, Excel, CSV)

### **10.3: Data Visualization & Analytics**

#### **Chart Components**
- [ ] **Performance Charts**
  - Line charts for performance trends
  - Bar charts for comparative analysis
  - Pie charts for categorical breakdowns
  - Radar charts for skill assessments

#### **Statistical Analysis Tools**
- [ ] **Trend Analysis**
  - Performance improvement tracking
  - Seasonal progression analysis
  - Game-by-game performance trends
  - Predictive performance modeling

#### **Comparative Analytics**
- [ ] **Player Comparisons**
  - Side-by-side player statistical comparisons
  - Team ranking and performance metrics
  - Position-based performance analysis
  - Benchmarking against team averages

---

## 🏐 **Volleyball-Specific Statistics**

### **Offensive Statistics**
- [ ] **Attacking Stats**
  - Kills, Attacks, Attack Errors
  - Hitting Percentage calculation
  - Kill Efficiency metrics
  - Attack zones and success rates

- [ ] **Serving Stats**
  - Aces, Service Errors, Total Serves
  - Service Percentage calculations
  - Service zones and effectiveness
  - Service pressure metrics

### **Defensive Statistics**
- [ ] **Defensive Stats**
  - Digs, Reception Errors, Total Receptions
  - Reception Percentage and efficiency
  - Defensive zone coverage
  - Dig efficiency metrics

- [ ] **Blocking Stats**
  - Block Solos, Block Assists, Block Errors
  - Block Percentage calculations
  - Block effectiveness by position
  - Stuff blocks and tool blocks

### **Setting Statistics**
- [ ] **Setting Stats**
  - Assists, Setting Errors, Total Sets
  - Setting Percentage and efficiency
  - Distribution analysis by hitter
  - Set location effectiveness

### **Overall Performance**
- [ ] **Game Performance**
  - Points scored, Games won/lost
  - Plus/Minus performance tracking
  - Time on court statistics
  - Performance under pressure

---

## 🛠 **Technical Implementation**

### **Backend Architecture**
```javascript
// Key Backend Components:
- routes/statistics.js - Statistics management API
- middleware/fileUpload.js - CSV/Excel upload handling
- models/statistics.js - Statistics data models
- utils/statisticsCalculator.js - Statistical calculation utilities
- utils/csvParser.js - CSV parsing utilities
- utils/excelParser.js - Excel parsing utilities
```

### **Frontend Architecture**
```typescript
// Key Frontend Components:
- services/statistics.service.ts - Statistics API service
- components/statistics-dashboard/ - Main statistics overview
- components/player-stats/ - Individual player statistics
- components/team-stats/ - Team statistics display
- components/statistics-import/ - File import interface
- components/statistics-charts/ - Data visualization components
- components/statistics-export/ - Export functionality
```

### **Database Schema**
```sql
-- Player statistics table
CREATE TABLE player_statistics (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL, -- 'offense', 'defense', 'serving', 'setting'
  stat_name VARCHAR(100) NOT NULL,    -- 'kills', 'digs', 'aces', 'assists'
  stat_value DECIMAL(10,3) NOT NULL,  -- Statistical value
  stat_date DATE NOT NULL,            -- Date of performance
  game_type VARCHAR(50),              -- 'practice', 'scrimmage', 'match'
  opponent VARCHAR(100),              -- Opponent team name
  notes TEXT,                         -- Additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team statistics table
CREATE TABLE team_statistics (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES team(id) ON DELETE CASCADE,
  stat_category VARCHAR(50) NOT NULL,
  stat_name VARCHAR(100) NOT NULL,
  stat_value DECIMAL(10,3) NOT NULL,
  stat_date DATE NOT NULL,
  game_type VARCHAR(50),
  opponent VARCHAR(100),
  set_number INTEGER,               -- Set number within match
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📅 **Implementation Timeline**

### **Day 1-2: Backend Statistics Infrastructure**
- Create database tables for player and team statistics
- Implement basic CRUD API endpoints for statistics
- Set up file upload infrastructure with multer
- Create CSV and Excel parsing utilities

### **Day 3-4: Statistics Import System**
- Build CSV parsing functionality with csv-parser
- Implement Excel parsing with xlsx library
- Create bulk import API endpoints
- Add data validation and error handling

### **Day 5-6: Frontend Statistics Components**
- Build statistics service for API communication
- Create statistics dashboard with overview
- Implement player and team statistics displays
- Add manual statistics entry forms

### **Day 7-8: Data Visualization**
- Integrate charting library (Chart.js or similar)
- Create performance trend charts
- Build comparative analysis components
- Add statistical calculation utilities

### **Day 9-10: Import/Export & Polish**
- Build file import interface with drag-and-drop
- Implement export functionality (CSV, Excel, PDF)
- Add advanced filtering and search capabilities
- Final testing and performance optimization

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- [ ] Coaches can manually enter player and team statistics
- [ ] Statistics can be imported from CSV and Excel files
- [ ] Visual charts display performance trends and comparisons
- [ ] Statistics can be exported in multiple formats
- [ ] Role-based access controls statistics visibility

### **Technical Requirements**
- [ ] Efficient handling of large statistical datasets
- [ ] Fast chart rendering and data visualization
- [ ] Secure file upload and processing
- [ ] Accurate statistical calculations and aggregations
- [ ] Responsive design for mobile statistics viewing

### **Performance Requirements**
- [ ] Statistics dashboard loads in < 3 seconds
- [ ] Import processing completes in reasonable time
- [ ] Charts render smoothly with animation
- [ ] Export generation completes without timeout

---

## 📊 **Statistical Categories & Metrics**

### **Offensive Categories**
- **Attacking**: Kills, Attacks, Errors, Hitting %
- **Serving**: Aces, Errors, Total Serves, Service %
- **Setting**: Assists, Errors, Total Sets, Setting %

### **Defensive Categories**
- **Reception**: Receptions, Errors, Reception %
- **Digging**: Digs, Dig Attempts, Dig %
- **Blocking**: Solo Blocks, Assist Blocks, Block Errors

### **Game Categories**
- **Match Results**: Wins, Losses, Sets Won/Lost
- **Performance**: Points, Plus/Minus, Court Time
- **Efficiency**: Overall Efficiency Rating

---

## 🔗 **Integration Points**

### **Existing Systems Enhanced**
1. **Player Management** - Statistics attached to player profiles
2. **Team Management** - Team performance tracking
3. **Analytics Dashboard** - Enhanced with statistical data
4. **Skill Rating System** - Performance data correlation

### **Database Relationships**
- Statistics linked to players and teams
- Integration with existing player and team tables
- Performance data correlation with skill ratings
- Historical tracking of statistical improvements

---

## 📋 **Dependencies & Prerequisites**

### **Required Libraries**
- **csv-parser** - CSV file processing
- **xlsx** - Excel file processing  
- **multer** - File upload handling
- **Chart.js** or **D3.js** - Data visualization
- **file-saver** - File download functionality

### **Database Requirements**
- PostgreSQL with statistical data storage
- Indexed queries for fast statistical retrieval
- Aggregation capabilities for statistical calculations

---

## 🚀 **Post-Phase 10 Benefits**

### **For Coaches**
- Comprehensive performance tracking and analysis
- Data-driven decision making for training
- Easy import of game statistics from scorebooks
- Visual performance trends and insights

### **For Players**
- Personal performance tracking and improvement
- Clear statistical goals and benchmarks
- Historical performance comparison
- Motivation through statistical achievement

### **For Teams**
- Team performance analysis and strategy
- Comparative analysis against opponents
- Season-long performance tracking
- Statistical reporting for stakeholders

---

## 🎯 **Success Metrics**

### **User Adoption**
- [ ] 80%+ of coaches actively enter statistics
- [ ] 90%+ of players view their statistics regularly
- [ ] 70%+ of teams use import functionality

### **System Performance**
- [ ] Statistics dashboard loads in < 3 seconds
- [ ] File imports process successfully 95%+ of time
- [ ] Charts render smoothly on all devices

### **Data Quality**
- [ ] 95%+ accuracy in statistical calculations
- [ ] Comprehensive coverage of volleyball statistics
- [ ] Reliable import/export functionality

---

**Status:** Planning document complete  
**Next Action:** Begin Phase 10.1 backend statistics infrastructure  
**Dependencies:** Complete Phase 4 testing, resolve any outstanding issues
