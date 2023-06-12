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