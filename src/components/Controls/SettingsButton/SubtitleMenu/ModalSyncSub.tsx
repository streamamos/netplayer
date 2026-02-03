import React, { useState, useEffect, useRef } from 'react';
import { useSubtitleSettings, useVideoProps } from '../../../../contexts';
import { useVideo } from '../../../../contexts/VideoContext';
import { useVideoState } from '../../../../contexts/VideoStateContext';
import IconMinusCircle from '../../../icons/MinusCircleIcon';
import IconPlusCircle from '../../../icons/PlusIconCircle';
import IconPlus from '../../../icons/IconPlus';
import MinusIcon from '../../../icons/MinusIcon';
import styles from './index.module.css';

// Import shared utilities and types from Subtitle.tsx
import {
  SrtParser2Entry,
  PlusSubEntry,
  SubtitleEntry,
  requestSubtitle,
  useSubtitleParser,
  cleanSubtitleText,
} from '../../../../components/Subtitle/Subtitle';

const ModalSyncSub = () => {
  const { i18n } = useVideoProps();
  const { delayTime: delayTimeSetting, setDelayTime: setDelayTimeSetting } =
    useSubtitleSettings();
  const { state } = useVideoState();
  const { videoEl } = useVideo();
  const [delayTime, setDelayTime] = useState<string | number>(delayTimeSetting);
  const [subtitleText, setSubtitleText] = useState<string | null>(null);
  const [currentSubIndex, setCurrentSubIndex] = useState<number>(-1);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeSubRef = useRef<HTMLDivElement>(null);

  // Get current subtitle file
  const subtitle = state.subtitles?.find((sub) => sub.lang === state.currentSubtitle);

  // Load subtitle file
  useEffect(() => {
    if (!subtitle?.file) {
      setSubtitleText(null);
      return;
    }

    const loadSubtitles = async () => {
      setIsLoadingSubtitles(true);
      try {
        const text = await requestSubtitle(subtitle.file);
        setSubtitleText(text);
      } catch (error) {
        console.error('Error loading subtitles:', error);
        setSubtitleText(null);
      }
      setIsLoadingSubtitles(false);
    };

    loadSubtitles();
  }, [subtitle]);

  // Parse subtitles using the shared hook
  const { subtitleEntries, usingSrtParser2 } = useSubtitleParser(subtitleText);

  // Track current subtitle based on video time (accounting for delay)
  useEffect(() => {
    if (!videoEl || subtitleEntries.length === 0) return;

    const updateCurrentSub = () => {
      const currentTime = videoEl.currentTime;
      // Match the delay logic from Subtitle.tsx: delayTime * -0.001
      const delayInSeconds = (Number(delayTime) || 0) * -0.001;
      const adjustedTime = currentTime + delayInSeconds;
      let foundIndex = -1;

      if (usingSrtParser2) {
        foundIndex = subtitleEntries.findIndex(
          (entry) =>
            (entry as SrtParser2Entry).startSeconds <= adjustedTime &&
            (entry as SrtParser2Entry).endSeconds >= adjustedTime
        );
      } else {
        // For @plussub parser (uses milliseconds)
        foundIndex = subtitleEntries.findIndex(
          (entry) =>
            (entry as PlusSubEntry).from <= adjustedTime * 1000 &&
            (entry as PlusSubEntry).to >= adjustedTime * 1000
        );
      }

      setCurrentSubIndex(foundIndex);
    };

    videoEl.addEventListener('timeupdate', updateCurrentSub);
    // Also update immediately when delay changes
    updateCurrentSub();
    
    return () => {
      videoEl.removeEventListener('timeupdate', updateCurrentSub);
    };
  }, [videoEl, subtitleEntries, usingSrtParser2, delayTime]);

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (activeSubRef.current && transcriptRef.current) {
      const container = transcriptRef.current;
      const activeElement = activeSubRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      // Check if active element is not in view
      if (
        activeRect.top < containerRect.top ||
        activeRect.bottom > containerRect.bottom
      ) {
        // Calculate the scroll position needed within the container
        const relativeTop = activeElement.offsetTop - container.offsetTop;
        const containerHeight = container.clientHeight;
        const elementHeight = activeElement.clientHeight;
        
        // Center the element in the container
        const scrollTo = relativeTop - (containerHeight / 2) + (elementHeight / 2);
        
        container.scrollTo({
          top: scrollTo,
          behavior: 'smooth',
        });
      }
    }
  }, [currentSubIndex]);

  // Handle clicking on a subtitle to sync
  const handleSubtitleClick = (entry: SubtitleEntry) => {
    if (!videoEl) return;

    const currentTime = videoEl.currentTime;
    let subtitleStartTime: number;

    if (usingSrtParser2) {
      subtitleStartTime = (entry as SrtParser2Entry).startSeconds;
    } else {
      subtitleStartTime = (entry as PlusSubEntry).from / 1000;
    }

    // Calculate the delay needed to make this subtitle appear at current time
    const calculatedDelay = Math.round((subtitleStartTime - currentTime) * -1000);

    setDelayTime(calculatedDelay);
    setDelayTimeSetting(calculatedDelay);
  };

  // Update both local state and context immediately on change
  const handleDelayChange = (value: string) => {
    if (value === '-' || value === '') {
      setDelayTime(value);
      return;
    }

    const regex = new RegExp('^[+-]?[0-9]+(?:\\.[0-9]+)?$');
    if (regex.test(value)) {
      const numericValue = Number(value);
      setDelayTime(numericValue);
      setDelayTimeSetting(numericValue);
    }
  };

  const updateDelay = (newValue: number) => {
    setDelayTime(newValue);
    setDelayTimeSetting(newValue);
  };

  const handleReset = () => {
    setDelayTime(0);
    setDelayTimeSetting(0);
  };

  // Format time for display - shows at what video time this subtitle will appear
  const formatTime = (subtitleOriginalTime: number): string => {
    const delayInSeconds = (Number(delayTime) || 0) * 0.001;
    const videoTimeWhenSubAppears = Math.max(0, subtitleOriginalTime + delayInSeconds);
    
    const hours = Math.floor(videoTimeWhenSubAppears / 3600);
    const mins = Math.floor((videoTimeWhenSubAppears % 3600) / 60);
    const secs = Math.floor(videoTimeWhenSubAppears % 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalOverlay}></div>
      <div className={styles.modalContainer}>
        <div className={styles.modalControl}>
          <button onClick={() => updateDelay(Number(delayTime) - 1000)}>
            <IconMinusCircle style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
          <button onClick={() => updateDelay(Number(delayTime) - 100)}>
            <MinusIcon
              style={{ width: '1.6rem', height: '1.6rem', color: 'white' }}
            />
          </button>
          <input
            type="text"
            value={delayTime}
            className={styles.modalInput}
            onChange={(e) => handleDelayChange(e.target.value)}
          />
          <button onClick={() => updateDelay(Number(delayTime) + 100)}>
            <IconPlus style={{ width: '1.6rem', height: '1.6rem' }} />
          </button>
          <button onClick={() => updateDelay(Number(delayTime) + 1000)}>
            <IconPlusCircle style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
        </div>
        <div className={styles.modalButtons}>
          <button className={styles.modalButtonApply} onClick={handleReset}>
            {i18n.settings.apply}
          </button>
        </div>

        {/* Subtitle Transcript Section */}
        {!isLoadingSubtitles && subtitleEntries.length > 0 && (
          <div className={styles.transcriptContainer} ref={transcriptRef}>
            <div className={styles.transcriptList}>
              {subtitleEntries.map((entry, index) => {
                const isActive = index === currentSubIndex;
                const startTime = usingSrtParser2
                  ? (entry as SrtParser2Entry).startSeconds
                  : (entry as PlusSubEntry).from / 1000;
                const text = cleanSubtitleText(entry.text);

                return (
                  <div
                    key={`${entry.id}-${index}`}
                    ref={isActive ? activeSubRef : null}
                    className={`${styles.transcriptItem} ${
                      isActive ? styles.transcriptItemActive : ''
                    }`}
                    onClick={() => handleSubtitleClick(entry)}
                  >
                    <span className={styles.transcriptTime}>
                      {formatTime(startTime)}
                    </span>
                    <span className={styles.transcriptText}>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalSyncSub;