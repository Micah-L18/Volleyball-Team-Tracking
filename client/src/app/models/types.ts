// Authentication interfaces
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  teams?: UserTeam[];
}

export interface UserTeam {
  id: number;
  name: string;
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
}

// Team interfaces
export interface Team {
  id?: number;
  name: string;
  level?: string;
  season?: string;
  age_group?: string;
  description?: string;
  photo_url?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  role?: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
  joined_date?: string;
}

export interface TeamDetails extends Team {
  creator_first_name?: string;
  creator_last_name?: string;
  members: TeamMember[];
  userRole: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
}

export interface TeamMember {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
  joined_date: string;
}

export interface TeamUser {
  id?: number;
  team_id: number;
  user_id: number;
  role: 'head_coach' | 'assistant_coach' | 'player' | 'parent';
  player_id?: number;
  invited_by?: number;
  invited_at?: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
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
