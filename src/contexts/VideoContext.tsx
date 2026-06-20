import React, { useCallback, useContext, useEffect } from 'react';
import Hls from 'hls.js';

interface VideoState {
  currentTime: number;
  duration: number;
  ended: boolean;
  paused: boolean;
  volume: number;
  playbackRate: number;
  buffering: boolean;
  error: string | null;
  seeking: boolean;
}

interface VideoContextProps {
  videoEl: HTMLVideoElement | null;
  videoState: VideoState;
  setVideoState: (state: Partial<VideoState>) => void;
}

interface VideoContextProviderProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  hlsRef: React.RefObject<Hls>;
}

const LOCALSTORAGE_KEY = 'netplayer_video_settings';

const getStoredVolume = () => {
  const rawSettings = localStorage.getItem(LOCALSTORAGE_KEY);

  if (!rawSettings) return 1;

  try {
    const settings = JSON.parse(rawSettings);
    const volume = settings?.volume;

    if (typeof volume === 'number' && volume >= 0 && volume <= 1) {
      return volume;
    }
  } catch {
    return 1;
  }

  return 1;
};

const setStoredVolume = (volume: number) => {
  const rawSettings = localStorage.getItem(LOCALSTORAGE_KEY);
  let previousSettings = {};

  if (rawSettings) {
    try {
      previousSettings = JSON.parse(rawSettings);
    } catch {
      previousSettings = {};
    }
  }

  localStorage.setItem(
    LOCALSTORAGE_KEY,
    JSON.stringify({
      ...previousSettings,
      volume,
    })
  );
};

const defaultState: VideoState = {
  currentTime: 0,
  buffering: true,
  duration: 0,
  ended: false,
  paused: true,
  volume: 1,
  playbackRate: 1,
  seeking: false,
  error: '',
};

export const VideoContext = React.createContext<VideoContextProps>({
  videoEl: null,
  videoState: defaultState,
  setVideoState: () => {},
});

export const VideoContextProvider: React.FC<VideoContextProviderProps> = ({
  videoRef,
  hlsRef,
  children,
}) => {
  const [videoState, setVideoState] = React.useState<VideoState>(defaultState);
  const [videoEl, setVideoEl] = React.useState<HTMLVideoElement | null>(null);
  const [hls, setHls] = React.useState<Hls | null>(null);
  const updateState = useCallback((state: Partial<VideoState>) => {
    setVideoState((prev) => ({ ...prev, ...state }));
  }, []);
  useEffect(() => {
    if (!videoRef?.current) return;
    setVideoEl(videoRef.current);
  }, [videoRef]);
  useEffect(() => {
    if (!hlsRef?.current) return;
    setHls(hlsRef.current);
  }, [hlsRef]);
  useEffect(() => {
    if (!videoEl) return;

    const storedVolume = getStoredVolume();

    videoEl.volume = storedVolume;
    updateState({ volume: storedVolume });
    setStoredVolume(storedVolume);
  }, [updateState, videoEl]);
  useEffect(() => {
    if (!videoEl) return;
    const handleError = () => {
      updateState({
        error: videoEl.error?.message || 'Something went wrong with video',
      });
    };
    const handleWaiting = () => {
      updateState({
        buffering: true,
      });
    };
    const handleloadeddata = () => {
      updateState({
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
        playbackRate: videoEl.playbackRate,
        buffering: false,
        error: null,
      });
    };
    const handlePlay = () => {
      updateState({
        paused: false,
        buffering: false,
      });
    };
    const handlePause = () => {
      updateState({
        paused: true,
      });
    };
    const handleTimeupdate = () => {
      updateState({
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
        buffering: false,
        error: null,
        paused: videoEl.paused,
      });
    };
    const handleEnded = () => {
      updateState({ ended: true, paused: true });
    };
    const handleVolumeChange = () => {
      setStoredVolume(videoEl.volume);
      updateState({ volume: videoEl.volume });
    };
    const handleRateChange = () => {
      updateState({ playbackRate: videoEl.playbackRate });
    };
    videoEl.addEventListener('waiting', handleWaiting);
    videoEl.addEventListener('loadeddata', handleloadeddata);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('playing', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('timeupdate', handleTimeupdate);
    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('volumechange', handleVolumeChange);
    videoEl.addEventListener('ratechange', handleRateChange);
    videoEl.addEventListener('error', handleError);
    return () => {
      videoEl.removeEventListener('waiting', handleWaiting);
      videoEl.removeEventListener('loadeddata', handleloadeddata);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('playing', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('timeupdate', handleTimeupdate);
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('volumechange', handleVolumeChange);
      videoEl.removeEventListener('ratechange', handleRateChange);
      videoEl.removeEventListener('error', handleError);
    };
  }, [updateState, videoEl]);
  useEffect(() => {
    if (!hls) return;
    hls.on(Hls.Events.ERROR, (_, data) => {
      updateState({
        error: data.details,
      });
    });
  }, [hls, updateState]);
  return (
    <VideoContext.Provider
      value={{ videoEl, videoState, setVideoState: updateState }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  return useContext(VideoContext);
};
