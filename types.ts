
export enum PlayerRole {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-Rounder',
  WICKET_KEEPER = 'Wicket-Keeper'
}

export enum MatchStatus {
  UPCOMING = 'Upcoming',
  LIVE = 'Live',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum MatchType {
  T20 = 'T20',
  ODI = 'ODI',
  TEST = 'Test',
  SOLO_TEST = 'Solo Test',
  INDIVIDUAL = 'Individual Player',
  CUSTOM = 'Custom'
}

export interface PlayerStats {
  matches: number;
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  highScore: number;
  bestBowling: string;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  teamId: string;
  imageUrl?: string;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  players: string[]; // Player IDs
  logoUrl?: string;
}

export interface BallRecord {
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
  batsmanId: string;
  bowlerId: string;
}

export interface Inning {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  history: BallRecord[];
  batsmenStats: Record<string, { runs: number; balls: number; boundaries: { fours: number; sixes: number }; isOut: boolean }>;
  bowlersStats: Record<string, { overs: number; balls: number; runs: number; wickets: number; maidens: number }>;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  teamARoster?: string[]; // Player IDs in batting order
  teamBRoster?: string[]; // Player IDs in batting order
  playerPool?: string[];  // Player IDs in rotation/batting order for individual matches
  venue: string;
  date: string;
  type: MatchType;
  maxOvers: number;
  status: MatchStatus;
  innings: Inning[];
  currentInningIndex: number;
  winnerTeamId?: string;
}
