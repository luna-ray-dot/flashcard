export interface Participant {
  userId: string;
  username?: string;
  score?: number;
  isAI?: boolean;
}

export interface BattleState {
  id: string;
  participants: Participant[];
  currentCardId?: string;
  currentQuestion?: string;
  winner?: string; // userId of winner
  status?: 'waiting' | 'in_progress' | 'finished';
}
