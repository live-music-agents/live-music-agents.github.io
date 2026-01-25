
export interface Paper {
  id: number;
  title: string;
  url: string;
  venue: string;
  year: number | null;
  codes: Set<number>;
  abstract: string | null;
  authors: string | null;
  additionalResources: string[];
  sourceType: 'paper' | 'video';
}

export interface CodeMap {
  id: number;
  aspect: string;
  dimension: string;
  code: string;
}

export interface AspectData {
  [aspectName: string]: CodeMap[];
}

export enum View {
  TRENDS = 'TRENDS',
  CO_OCCURRENCE = 'CO_OCCURRENCE',
  EXPLORER = 'EXPLORER',
  DISTRIBUTION = 'DISTRIBUTION',
  ABOUT = 'ABOUT',
}

export interface CooccurrenceFilter {
  type: 'cooccurrence';
  codeId1: number;
  codeId2: number;
}

export interface TrendFilter {
  type: 'trend';
  codeId: number | null;
  yearBin: number;
  binSize: number;
}

export interface CodeFilter {
  type: 'code';
  codeId: number;
  originView: View.TRENDS | View.CO_OCCURRENCE | View.DISTRIBUTION;
}

export type PaperFilter = CooccurrenceFilter | TrendFilter | CodeFilter;
