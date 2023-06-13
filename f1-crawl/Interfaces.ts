export interface YearlyRaceResult {
  grandPrix: string;
  date: string;
  winner: string;
  car: string;
  laps: string;
  time: string;
}

export interface RaceResultByGrandPrix {
  pos: string;
  no: string;
  driver: string;
  car: string;
  laps: string;
  time_or_retired: string;
  pts: string;
}

export interface YearlyDriverResult {
  pos: string;
  driver: string;
  nationality: string
  car: string
  pts: string
}

export interface DriverResultByGrandPrix {
  grandPrix: string;
  date: string;
  car: string;
  pos: string;
  pts: string;
}

export interface YearlyTeamResult {
  pos: string;
  team: string;
  pts: string;
}

export interface TeamResultByGrandPrix {
  grandPrix: string;
  date: string;
  pts: string;
}

export interface YearlyAward {
  grandPrix: string;
  driver: string;
  car: string;
  time: string;
}