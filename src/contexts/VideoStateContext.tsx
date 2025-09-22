/* eslint-disable react/prop-types */
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { Audio, Subtitle } from '../types';
import { isInArray } from '../utils';
import { useVideoProps } from './VideoPropsContext';

export interface VideoState {
  subtitles: Subtitle[];
  qualities: string[];
  currentQuality: string | null;
  currentSubtitle: string | null;
  isSubtitleDisabled: boolean;
  currentAudio: string | null;
  audios: Audio[];
}

type StateSelector = (currentState: VideoState) => Partial<VideoState>;

type UpdateStateAction = (stateSelector: StateSelector) => void;

interface VideoContextProps {
  state: VideoState;
  setState: UpdateStateAction;
}

interface VideoContextProviderProps {
  defaultState?: Partial<VideoState>;
}

const defaultVideoState: VideoState = {
  subtitles: [],
  qualities: [],
  audios: [],
  currentQuality: null,
  currentSubtitle: null,
  currentAudio: null,
  isSubtitleDisabled: false,
};

export const VideoStateContext = React.createContext<VideoContextProps>({
  state: defaultVideoState,
  setState: () => {},
});

const LOCALSTORAGE_KEY = 'netplayer_video_settings';

function getLangCode(lang: string | null | undefined): string | null {
  if (!lang) return null;
  const match = lang.match(/^\(([^)]+)\)/);
  if (!match) return lang;
  const inside = match[1].trim();
  const parts = inside.split(/\s+/);
  if (parts.length > 1 && parts[parts.length - 1].match(/^v\d+$/i)) {
    // If the last part is a version like "v1", "v2", etc., exclude it
    return parts.slice(0, -1).join(' ');
  }
  return inside;
}

export const VideoStateContextProvider: React.FC<VideoContextProviderProps> = ({
  children,
}) => {
  const props = useVideoProps();
  const defaultQualities = useMemo(
    () =>
      props.sources
        .filter((source) => source.label)
        .map((source) => source.label!),
    [props.sources]
  );
  const defaultState = useMemo(
    () => ({
      currentSubtitle: props.subtitles[0]?.lang,
      subtitles: props.subtitles,
      qualities: defaultQualities,
    }),
    [props.subtitles, defaultQualities]
  );
  const getState = useCallback(() => {
    const rawSettings = localStorage.getItem(LOCALSTORAGE_KEY);
    const newState = {
      ...defaultVideoState,
      ...defaultState,
      ...props?.defaultVideoState,
    };
    if (!rawSettings) return newState;
    const settings: Partial<VideoState> = JSON.parse(rawSettings);
    const langAudios = newState.audios
      .filter((a) => a?.lang)
      .map((a) => a.lang);
    const langSubtitles = newState.subtitles
      .filter((a) => a?.lang)
      .map((s) => s.lang);
    const langQualities = newState.qualities;
    const filteredSettings = {
      currentAudio:
        isInArray(settings?.currentAudio, langAudios) || langAudios.length === 0
          ? (settings.currentAudio as string) || null
          : newState.currentAudio,
      currentQuality:
        isInArray(settings?.currentQuality, langQualities) ||
        langQualities.length === 0
          ? (settings.currentQuality as string) || null
          : newState.currentQuality,
    };

    let currentSubtitle: string | null;
    if (isInArray(settings?.currentSubtitle, langSubtitles) || langSubtitles.length === 0) {
      currentSubtitle = (settings.currentSubtitle as string) || null;
    } else {
      // Smart matching logic
      const savedSubtitle = settings?.currentSubtitle;
      const savedBase = getLangCode(savedSubtitle);
      if (savedBase) {
        // Find the first subtitle with matching base language code
        const matchingSub = newState.subtitles.find(
          (s) => getLangCode(s.lang) === savedBase
        );
        if (matchingSub) {
          currentSubtitle = matchingSub.lang;
        } else {
          currentSubtitle = newState.currentSubtitle;
        }
      } else {
        currentSubtitle = newState.currentSubtitle;
      }
    }

    return { ...newState, ...filteredSettings, currentSubtitle };
  }, [defaultState, props?.defaultVideoState]);
  const [state, setState] = React.useState<VideoState>(getState);
  useEffect(() => {
    const state = getState();
    setState(state);
  }, [getState]);
  useEffect(() => {
    const {
      currentAudio,
      currentQuality,
      currentSubtitle,
      isSubtitleDisabled,
      subtitles,
    } = state;
    
    // Track if this is a fallback selection
    const isFallbackSelection = (() => {
      // Get the previous settings from localStorage
      const rawSettings = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!rawSettings) return false;
      
      const settings = JSON.parse(rawSettings);
      const savedSubtitle = settings?.currentSubtitle;
      
      // If there's no saved subtitle, this isn't a fallback
      if (!savedSubtitle) return false;
      
      // If the current subtitle is already in localStorage, it's not a fallback
      if (savedSubtitle === currentSubtitle) return false;
      
      // If the current subtitle is the first one AND we're in the smart matching logic path
      // where no matching subtitle was found, then it's a fallback
      if (currentSubtitle === subtitles[0]?.lang) {
        const savedBase = getLangCode(savedSubtitle);
        if (savedBase) {
          // Check if there's any subtitle with matching base language
          const matchingSub = subtitles.find(
            (s) => getLangCode(s.lang) === savedBase
          );
          // If no matching subtitle was found, this is a fallback selection
          return !matchingSub;
        }
      }
      
      return false;
    })();
    
    // Don't save if it's "(Sem Fonte)" or a fallback selection
    if (!currentSubtitle?.includes("(Sem Fonte)") && !isFallbackSelection) {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({
          currentAudio,
          currentQuality,
          currentSubtitle,
          isSubtitleDisabled,
        })
      );
    }
  }, [state]);
  const updateState: UpdateStateAction = (stateSelector) => {
    setState((prev) => ({ ...prev, ...stateSelector(prev) }));
  };
  return (
    <VideoStateContext.Provider value={{ state, setState: updateState }}>
      {children}
    </VideoStateContext.Provider>
  );
};

export const useVideoState = () => {
  return useContext(VideoStateContext);
};
