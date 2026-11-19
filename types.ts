export enum GameMode {
  MENU = 'MENU',
  PLOT_SELECTION = 'PLOT_SELECTION',
  PLOT_INTERACTION = 'PLOT_INTERACTION',
  PARKOUR = 'PARKOUR',
  MINI_GAME = 'MINI_GAME',
  GAME_OVER = 'GAME_OVER',
  CONFESSION = 'CONFESSION',
}

export enum LocationType {
  SCHOOL = 'SCHOOL',
  SHOP = 'SHOP',
  BAR = 'BAR',
  HOME = 'HOME',
  MY_SHOP = 'MY_SHOP',
}

export type GameOverReason =
  | 'CAPTURED'
  | 'OUT_OF_MILK_IMPRISONED'
  | 'OUT_OF_MILK_BAD'
  | 'SON_SAD'
  | 'SON_HAPPY'
  | 'BANKRUPTCY'
  | 'HAREM_ENDING';

export interface PlayerStats {
  milk: number; // 0 - 100 Energy / Special Milk resource
  money: number;
  tuitionPaid: number;
  tuitionTotal: number;
  day: number;
  timeSlot: number; // 1 = Morning, 2 = Afternoon, 3 = Evening, 4 = Late Night
  semester: number;
  lastSettledDay: number;
  inventory: string[]; // Owned clothing IDs
  gifts: Record<string, number>; // Owned gift counts by itemId
  equippedItem: string | null;
  hasShop: boolean;
  relationship: string | null; // ID of partnered NPC
  totalEarned: number;
  parkourWins: number;
  worksCompleted: number;
  giftsGiven: number;
  claimedMissions: string[];
  seenEvents: string[];
}

export interface NPC {
  id: string;
  name: string;
  species: 'Tiger' | 'Fox' | 'Wolf' | 'Little Rabbit' | 'Unknown';
  location: LocationType;
  favorability: number;
  description: string;
}

export type DialogueAction =
  | 'WORK'
  | 'TRADE_MILK'
  | 'FLIRT'
  | 'LEAVE'
  | 'ACCEPT_CONFESSION'
  | 'REJECT_CONFESSION'
  | 'SIDE_PRIMARY'
  | 'SIDE_COSTAR'
  | 'PACIFY_BOTH';

export interface DialogueLine {
  speakerId: string; // 'rabbit_dad' | 'tiger_principal' | 'fox_owner' | 'wolf_boss' | 'son' | 'narrator'
  speakerName: string;
  text: string;
}

export interface DialogueOption {
  text: string;
  action: DialogueAction;
  risk: number; // 0.0 - 1.0 chance to trigger Parkour chase
  rewardHint?: string;
}

export interface DialogueScene {
  id: string;
  title: string;
  isCrossover?: boolean;
  coStarId?: string;
  lines: DialogueLine[];
  options: DialogueOption[];
}

export interface ClothingItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  icon: string;
}

export interface ConsumableItem {
  id: string;
  name: string;
  price: number;
  milkRestore: number;
  desc: string;
  icon: string;
}

export interface GiftItem {
  id: string;
  name: string;
  price: number;
  favoriteOf: string; // npc.id
  desc: string;
  icon: string;
}

export interface MissionDef {
  id: string;
  title: string;
  desc: string;
  rewardText: string;
  rewardMoney: number;
  rewardMilk: number;
  isComplete: (stats: PlayerStats) => boolean;
}

export interface EndingInfo {
  id: GameOverReason;
  title: string;
  badge: string;
  summary: string;
  isPositive: boolean;
}
