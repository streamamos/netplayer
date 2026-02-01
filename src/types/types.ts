export type Source = {
  file: string;
  label?: string;
  type?: string | 'hls' | 'dash';
};

export type Subtitle = {
  file: string;
  lang: string;
  language: string;
};

export type Audio = {
  lang: string;
  language: string;
};

const shortcuts = [
  'play',
  'pause',
  'forward',
  'backward',
  'subtitle',
  'fullscreen',
  'volume',
] as const;

export type Shortcut = string | string[];
export type Shortcuts = Record<(typeof shortcuts)[number], Shortcut>;

export type HotKey = {
  fn: (videoEl: HTMLVideoElement) => void;
  name: string;
  hotKey: string | string[];
  preventDefault?: boolean;
};

export interface SegmentDetail {
  start_ms: number | null;
  end_ms: number | null;
  confidence: number | null;
  submission_count: number;
}

export interface skipsegments {
  intro?: SegmentDetail;
  recap?: SegmentDetail;
  credits?: SegmentDetail;
  [key: string]: SegmentDetail | undefined;
}

export interface CalculatedSegment {
  type: 'intro' | 'recap' | 'credits';
  startPercent: number;
  widthPercent: number;
}
