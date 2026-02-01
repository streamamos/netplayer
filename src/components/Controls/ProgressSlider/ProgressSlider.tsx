import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { useVideo } from '../../../contexts/VideoContext';
import { useVideoProps } from '../../../contexts/VideoPropsContext';
import { classNames, convertTime } from '../../../utils';
import { CalculatedSegment } from '../../../types/types';
import Slider from '../../Slider';
import ThumbnailHover from '../ThumbnailHover';
import styles from './ProgressSlider.module.css';

const ProgressSlider = () => {
  const { videoEl, setVideoState } = useVideo();
  const { skipsegments } = useVideoProps();
  const [bufferPercent, setBufferPercent] = useState(0);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // https://stackoverflow.com/questions/5029519/html5-video-percentage-loaded
  useEffect(() => {
    if (!videoEl) return;
    const handleProgressBuffer = () => {
      const buffer = videoEl.buffered;
      if (!buffer.length) return;
      if (!videoEl.duration) return;
      const bufferedTime = buffer.end(buffer.length - 1);
      const bufferedPercent = (bufferedTime / videoEl.duration) * 100;
      setBufferPercent(bufferedPercent);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };
    videoEl.addEventListener('progress', handleProgressBuffer);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoEl.removeEventListener('progress', handleProgressBuffer);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoEl]);
  const currentPercent = useMemo(() => {
    if (!videoEl?.duration) return 0;
    return (currentTime / videoEl.duration) * 100;
  }, [currentTime, videoEl?.duration]);

const calculatedSkipSegments = useMemo(() => {
  if (!skipsegments || !videoEl?.duration) return [];

  const segments: CalculatedSegment[] = [];
  const durationMs = videoEl.duration * 1000;

  for (const key in skipsegments) {
    const segment = skipsegments[key];
    if (!segment) continue;

    // Skip if both are null (no segment to show)
    if (segment.start_ms === null && segment.end_ms === null) continue;

    // If start_ms is null, starts at 0; if end_ms is null, goes to end
    const startMs = segment.start_ms ?? 0;
    const endMs = segment.end_ms ?? durationMs;

    // Ensure startMs is not greater than endMs
    const [finalStartMs, finalEndMs] = startMs > endMs ? [endMs, startMs] : [startMs, endMs];

    const startPercent = (finalStartMs / durationMs) * 100;
    const endPercent = (finalEndMs / durationMs) * 100;
    const widthPercent = endPercent - startPercent;

    // Skip if segment would extend beyond 100%
    if (startPercent + widthPercent > 100) continue;

    segments.push({
      type: key as 'intro' | 'recap' | 'credits',
      startPercent,
      widthPercent,
    });
  }
  return segments;
}, [skipsegments, videoEl?.duration]);


  const handlePercentIntent = useCallback((percent: number) => {
    setHoverPercent(percent);
  }, []);
  const handlePercentChange = useCallback(
    (percent: number) => {
      if (!videoEl?.duration) return;
      const newTime = (percent / 100) * videoEl.duration;
      videoEl.currentTime = newTime;
      if (videoEl.paused) {
        videoEl.play();
      }
      setVideoState({ seeking: false });
      setCurrentTime(newTime);
    },
    [setVideoState, videoEl]
  );
  const handleDragStart = useCallback(() => {
    setVideoState({ seeking: true });
  }, [setVideoState]);
  const handleDragEnd = useCallback(() => {
    setVideoState({ seeking: true });
  }, [setVideoState]);
  const handlePercentChanging = useCallback(
    (percent) => {
      if (!videoEl?.duration) return;
      if (!videoEl.paused) {
        videoEl.pause();
      }
      const newTime = (percent / 100) * videoEl.duration;
      setVideoState({ seeking: true });
      setCurrentTime(newTime);
    },
    [setVideoState, videoEl]
  );
  return (
    <Slider
      className={classNames(styles.container, isDesktop && styles.desktop)}
      onPercentIntent={handlePercentIntent}
      onPercentChange={handlePercentChange}
      onPercentChanging={handlePercentChanging}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.innerContainer}>
        <Slider.Bar className={styles.hoverBar} percent={hoverPercent} />
        <Slider.Bar className={styles.bufferBar} percent={bufferPercent} />
        <Slider.Bar className={styles.playBar} percent={currentPercent} />
        <Slider.Bar className={styles.backgroundBar} />
        {calculatedSkipSegments.map((segment, index) => (
          <div
            key={index}
            className={classNames(styles.skipSegment, styles[segment.type])}
            style={{ left: `${segment.startPercent}%`, width: `${segment.widthPercent}%` }}
          />
        ))}
        <Slider.Dot className={styles.dot} percent={currentPercent} />
        <ThumbnailHover hoverPercent={hoverPercent} />
        {!!hoverPercent && videoEl?.duration && (
          <div
            className={styles.hoverTime}
            style={{ left: hoverPercent + '%' }}
          >
            {convertTime((hoverPercent / 100) * videoEl.duration)}
          </div>
        )}
      </div>
    </Slider>
  );
};

export default ProgressSlider;
