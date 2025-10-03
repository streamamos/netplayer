import { parse } from '@plussub/srt-vtt-parser';
import React, { useEffect, useMemo, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { buildAbsoluteURL } from 'url-toolkit';
import { useSubtitleSettings } from '../../contexts/SubtitleSettingsContext';
import { useVideo } from '../../contexts/VideoContext';
import { useInteract } from '../../contexts/VideoInteractingContext';
import { useVideoState } from '../../contexts/VideoStateContext';
import { colorToRgba } from '../../utils/color';
import useTextScaling from '../../hooks/useTextScaling';
import { classNames, isValidUrl } from '../../utils';
import styles from './Subtitle.module.css';

// Regular expressions for ASS parsing
const re_ass = new RegExp(
  'Dialogue:\\s\\d,' +
  '(\\d+:\\d\\d:\\d\\d\\.\\d\\d),' +
  '(\\d+:\\d\\d:\\d\\d\\.\\d\\d),' +
  '([^,]*),' +
  '([^,]*),' +
  '(?:[^,]*,){4}' +
  '(.*)$',
  'i'
);
const re_newline = /\\n/ig;
const re_an8 = /{\\an\d}/g; // Regex to detect {\an8}

const re_font = /<font[^>]*>/g;
const re_font_close = /<\/font>/g;

// Custom ASS to SRT conversion function
const convertAssToSrt = (assText: string): string => {
  const srts: { start: string; end: string; text: string; hasAn8: boolean }[] = [];
  
  String(assText)
    .split(/\r*\n/)
    .forEach((line) => {
      const m = line.match(re_ass);
      if (!m) return;

      const start = m[1];
      const end = m[2];
      const rawText = m[5];
      const hasAn8 = re_an8.test(rawText);
      const text = rawText.replace(re_an8, '').replace(re_newline, '\r\n');
      srts.push({ start, end, text, hasAn8 });
    });

  let i = 1;
  const output = srts
    .sort((d1, d2) => {
      const s1 = assTime2Int(d1.start);
      const s2 = assTime2Int(d2.start);
      const e1 = assTime2Int(d1.end);
      const e2 = assTime2Int(d2.end);
      return s1 !== s2 ? s1 - s2 : e1 - e2;
    })
    .map((srt) => {
      const start = assTime2SrtTime(srt.start);
      const end = assTime2SrtTime(srt.end);
      // Store hasAn8 as a data attribute or similar if needed
      return `${i++}\n${start} --> ${end}\n${srt.text}\n\n`;
    })
    .join('');

  return output;
};

// Helper function to convert ASS time to integer for sorting
const assTime2Int = (assTime: string): number => {
  return parseInt(assTime.replace(/[^0-9]/g, ''));
};

// Helper function to convert ASS time format to SRT time format
const assTime2SrtTime = (assTime: string): string => {
  let h = '00',
    m = '00',
    s = '00',
    ms = '000';
  const t = assTime.split(':');
  if (t.length > 0) h = t[0].length === 1 ? '0' + t[0] : t[0];
  if (t.length > 1) m = t[1].length === 1 ? '0' + t[1] : t[1];
  if (t.length > 2) {
    const t2 = t[2].split('.');
    if (t2.length > 0) s = t2[0].length === 1 ? '0' + t2[0] : t2[0];
    if (t2.length > 1)
      ms = t2[1].length === 2 ? '0' + t2[1] : t2[1].length === 1 ? '00' + t2[1] : t2[1];
  }
  return `${h}:${m}:${s},${ms}`;
};

const textStyles = {
  none: '',
  outline: `black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px`,
  raised: `black 0px 0px 5px, black 0px 1px 5px, black 0px 2px 5px`,
  depressed: `black 0px -2px 1px`,
  dropShadow: `black 0px 2px 1px`,
};

const BASE_FONT_SIZE = 16;
const LINE_HEIHT_RATIO = 1.333;
const M3U8_SUBTITLE_REGEX = /.*\.(vtt|srt)/g;
const requestSubtitle = async (url: string): Promise<string | null> => {
  try {
    if (url.includes('.ass')) {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const initialText = new TextDecoder('utf-8').decode(buffer);
      const srtText = convertAssToSrt(initialText);
      const decoderUtf8 = new TextDecoder('utf-8');
      const decoderAnsi = new TextDecoder('windows-1252');
      const textUtf8 = decoderUtf8.decode(new TextEncoder().encode(srtText));
      const textAnsi = decoderAnsi.decode(new TextEncoder().encode(srtText));
      const text = textUtf8.includes('�') ? textAnsi : textUtf8;
      return text;
    }
    if (url.includes('vtt') || url.includes('srt')) {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const decoderUtf8 = new TextDecoder('utf-8');
      const decoderAnsi = new TextDecoder('windows-1252');
      const textUtf8 = decoderUtf8.decode(buffer);
      const textAnsi = decoderAnsi.decode(buffer);
      const text = textUtf8.includes('�') ? textAnsi : textUtf8;
      return text;
    }
    if (url.includes('m3u8')) {
      const response = await fetch(url);
      const text = await response.text();
      const matches = text.match(M3U8_SUBTITLE_REGEX);
      if (!matches?.length) return null;
      if (!matches[0]) return null;
      const nextUrl = isValidUrl(matches[0])
        ? matches[0]
        : buildAbsoluteURL(url, matches[0]);
      return requestSubtitle(nextUrl);
    }
    return null;
  } catch (error) {
    console.log('error text: ', error);
    return null;
  }
};

const Subtitle = () => {
  const { state } = useVideoState();
  const { state: subtitleSettings, delayTime } = useSubtitleSettings();
  const { moderateScale } = useTextScaling();
  const { videoEl } = useVideo();
  const { isInteracting } = useInteract();
  const [currentText, setCurrentText] = useState<string>('');
  const [hasAn8, setHasAn8] = useState<boolean>(false);
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const subtitle = useMemo(
    () => state.subtitles?.find((sub) => sub.lang === state.currentSubtitle),
    [state.subtitles, state.currentSubtitle]
  );

  useEffect(() => {
    if (!subtitle?.file) return;
    const getSubtitle = async () => {
      setIsLoading(true);
      setCurrentText("");
      const text = await requestSubtitle(subtitle.file);
      setIsLoading(false);
      if (!text) {
        setCurrentText(">> <i><b>Ocorreu um erro, escolhe outra legenda ou tenta novamente mais tarde.</b></i> <<");
        setSubtitleText("");
        return;
      };
      setSubtitleText(text);
    };
    getSubtitle();
  }, [subtitle]);

  useEffect(() => {
    if (!videoEl) return;
    let handleSubtitle: () => void = () => {};
    try {
      if (!subtitleText) return;
      const { entries = [] } = parse(subtitleText);
      handleSubtitle = () => {
        const currentTime = videoEl.currentTime * 1000;
        const currentEntry = entries.find(
          (entry) =>
            entry.from <= currentTime + delayTime * -1 &&
            entry.to >= currentTime + delayTime * -1
        );
        if (currentEntry) {
          const cleanedText = currentEntry.text
              .replace(re_an8, '')
              .replace(re_font, '')
              .replace(re_font_close, '');
          setCurrentText(cleanedText);
          setHasAn8(re_an8.test(currentEntry.text));
        } else {
          setCurrentText('');
          setHasAn8(false);
        }
      };
      videoEl.addEventListener('timeupdate', handleSubtitle);
    } catch (error) {
      console.log('error: ', error);
      setCurrentText(">> <i><b>Ocorreu um erro, escolhe outra legenda ou tenta novamente mais tarde.</b></i> <<");
    }
    return () => {
      videoEl.removeEventListener('timeupdate', handleSubtitle);
    };
  }, [subtitleText, delayTime, videoEl]);

  const fontSize = useMemo(() => {
    return moderateScale(subtitleSettings.fontSize * BASE_FONT_SIZE);
  }, [moderateScale, subtitleSettings.fontSize]);

  const lineHeight = useMemo(() => {
    return fontSize * LINE_HEIHT_RATIO;
  }, [fontSize]);

  if (isLoading || !subtitle?.file || !currentText || state.isSubtitleDisabled)
    return null;

  return (
    <div
      className={classNames(
        styles.container,
        isInteracting && isDesktop && styles.interacting,
        hasAn8 && styles.an8Style
      )}
    >
      <p
        className={classNames(styles.text)}
        style={{
          fontSize: fontSize + 'px',
          lineHeight: lineHeight + 'px',
          backgroundColor: `rgba(0, 0, 0, ${subtitleSettings.backgroundOpacity})`,
          backdropFilter: subtitleSettings.backgroundBlur ? 'blur(5px)' : 'none',
          color: colorToRgba(subtitleSettings.textColor, subtitleSettings.fontOpacity),
          textShadow: textStyles[subtitleSettings.textStyle],
        }}
        dangerouslySetInnerHTML={{ __html: currentText }}
      ></p>
    </div>
  );
};

export default Subtitle;
