export interface Player {
  id: number;
  name: string;
  position?: 'setter' | 'outside_hitter' | 'middle_blocker' | 'opposite' | 'libero' | 'defensive_specialist';
  year?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
  jersey_number?: number;
  height?: number; // in inches
  reach?: number; // in inches
  dominant_hand?: 'right' | 'left' | 'ambidextrous';
  contact_info?: string;
  notes?: string;
  photo_url?: string;
  team_id: number;
  team_name?: string;
  season?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlayerRequest {
  name: string;
  team_id: number;
  position?: string;
  year?: string;
  jersey_number?: number;
  height?: number;
  reach?: number;
  dominant_hand?: string;
  contact_info?: string;
  notes?: string;
  photo_url?: string;
}

export interface UpdatePlayerRequest {
  name?: string;
  position?: string;
  year?: string;
  jersey_number?: number;
  height?: number;
  reach?: number;
  dominant_hand?: string;
  contact_info?: string;
  notes?: string;
  photo_url?: string;
}

export interface PlayerFilters {
  teamId?: number;
  position?: string;
  year?: string;
  searchTerm?: string;
}

export const VOLLEYBALL_POSITIONS = [
  { value: 'setter', label: 'Setter' },
  { value: 'outside_hitter', label: 'Outside Hitter' },
  { value: 'middle_blocker', label: 'Middle Blocker' },
  { value: 'opposite', label: 'Opposite' },
  { value: 'libero', label: 'Libero' },
  { value: 'defensive_specialist', label: 'Defensive Specialist' }
] as const;

export const PLAYER_YEARS = [
  { value: 'freshman', label: 'Freshman' },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'graduate', label: 'Graduate' }
] as const;

export const DOMINANT_HANDS = [
  { value: 'Right', label: 'Right' },
  { value: 'Left', label: 'Left' },
  { value: 'Ambidextrous', label: 'Ambidextrous' }
] as const;
