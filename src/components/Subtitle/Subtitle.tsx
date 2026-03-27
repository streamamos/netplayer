import SrtParser2 from 'srt-parser-2';
import { parse } from '@plussub/srt-vtt-parser';
import React, { useEffect, useMemo, useState } from 'react';
import { buildAbsoluteURL } from 'url-toolkit';
import useCheckMobile from '../../hooks/useCheckMobile';
import { useSubtitleSettings } from '../../contexts/SubtitleSettingsContext';
import { useVideo } from '../../contexts/VideoContext';
import { useInteract } from '../../contexts/VideoInteractingContext';
import { useVideoState } from '../../contexts/VideoStateContext';
import { colorToRgba } from '../../utils/color';
import useTextScaling from '../../hooks/useTextScaling';
import { classNames, isValidUrl } from '../../utils';
import styles from './Subtitle.module.css';

// ============================================================================
// EXPORTED TYPES AND INTERFACES
// ============================================================================
export interface SrtParser2Entry {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
}

export interface PlusSubEntry {
  id: string;
  from: number;
  to: number;
  text: string;
}

export type SubtitleEntry = SrtParser2Entry | PlusSubEntry;

// ============================================================================
// EXPORTED REGULAR EXPRESSIONS
// ============================================================================
export const re_ass = new RegExp(
  'Dialogue:\\s\\d,' +
  '(\\d+:\\d\\d:\\d\\d\\.\\d\\d),' +
  '(\\d+:\\d\\d:\\d\\d\\.\\d\\d),' +
  '([^,]*),' +
  '([^,]*),' +
  '(?:[^,]*,){4}' +
  '(.*)$',
  'i'
);
export const re_newline = /\\n/ig;
export const re_an8 = /{\\an\d}/g;
export const re_font = /<font[^>]*>/g;
export const re_font_close = /<\/font>/g;
const M3U8_SUBTITLE_REGEX = /.*\.(vtt|srt)/g;

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================
export const assTime2Int = (assTime: string): number => {
  return parseInt(assTime.replace(/[^0-9]/g, ''));
};

export const assTime2SrtTime = (assTime: string): string => {
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

export const convertAssToSrt = (assText: string): string => {
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
      return `${i++}\n${start} --> ${end}\n${srt.text}\n\n`;
    })
    .join('');

  return output;
};

export const requestSubtitle = async (
  url: string,
  signal?: AbortSignal
): Promise<string | null> => {
  try {
    if (url.includes('.ass')) {
      const response = await fetch(url, { signal });
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
      const response = await fetch(url, { signal });
      const buffer = await response.arrayBuffer();
      const decoderUtf8 = new TextDecoder('utf-8');
      const decoderAnsi = new TextDecoder('windows-1252');
      const textUtf8 = decoderUtf8.decode(buffer);
      const textAnsi = decoderAnsi.decode(buffer);
      const text = textUtf8.includes('�') ? textAnsi : textUtf8;
      return text;
    }
    if (url.includes('m3u8')) {
      const response = await fetch(url, { signal });
      const text = await response.text();
      const matches = text.match(M3U8_SUBTITLE_REGEX);
      if (!matches?.length) return null;
      if (!matches[0]) return null;
      const nextUrl = isValidUrl(matches[0])
        ? matches[0]
        : buildAbsoluteURL(url, matches[0]);
      return requestSubtitle(nextUrl, signal);
    }
    return null;
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      console.log('Subtitle fetch aborted');
    } else {
      console.log('error text: ', error);
    }
    return null;
  }
};

export const cleanSubtitleText = (text: string): string => {
  return text
    .replace(re_an8, '')
    .replace(re_font, '')
    .replace(re_font_close, '')
    .replace(/<[^>]*>/g, '');
};

// ============================================================================
// EXPORTED HOOK: Parse subtitle text into entries
// ============================================================================
export const useSubtitleParser = (subtitleText: string | null) => {
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [usingSrtParser2, setUsingSrtParser2] = useState(true);

  useEffect(() => {
    if (!subtitleText) {
      setSubtitleEntries([]);
      return;
    }

    try {
      // Try srt-parser-2 first
      const parser = new SrtParser2();
      let entries: SubtitleEntry[] = parser.fromSrt(subtitleText);
      let usingParser2 = true;

      // If entries is empty, fallback to @plussub/srt-vtt-parser
      if (!entries || entries.length === 0) {
        const parseResult = parse(subtitleText);
        entries = parseResult.entries || [];
        usingParser2 = false;
      }

      setSubtitleEntries(entries);
      setUsingSrtParser2(usingParser2);
    } catch (error) {
      console.error('Error parsing subtitles:', error);
      setSubtitleEntries([{
        "id": "1",
        "startTime": "00:00:00,000",
        "startSeconds": 0,
        "endTime": "01:00:00,000",
        "endSeconds": 3600,
        "text": ">> <i><b>Ocorreu um erro, escolhe outra legenda ou tenta novamente mais tarde.</b></i> <<"
    }]);
    }
  }, [subtitleText]);

  return { subtitleEntries, usingSrtParser2 };
};

// ============================================================================
// COMPONENT
// ============================================================================
const textStyles = {
  none: '',
  outline: `black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px`,
  raised: `black 0px 0px 5px, black 0px 1px 5px, black 0px 2px 5px`,
  depressed: `black 0px -2px 1px`,
  dropShadow: `black 0px 2px 1px`,
};

const BASE_FONT_SIZE = 16;
const LINE_HEIHT_RATIO = 1.333;

const Subtitle = () => {
  const isMobile = useCheckMobile();
  const isDesktop = !isMobile;
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
    const controller = new AbortController();
    const getSubtitle = async () => {
      setIsLoading(true);
      setCurrentText("");
      const text = await requestSubtitle(subtitle.file, controller.signal);
      if (controller.signal.aborted) return;
      setIsLoading(false);
      if (!text) {
        setCurrentText(">> <i><b>Ocorreu um erro, escolhe outra legenda ou tenta novamente mais tarde.</b></i> <<");
        setSubtitleText("");
        return;
      };
      setSubtitleText(text);
    };
    getSubtitle();
    return () => {
      controller.abort();
    };
  }, [subtitle]);

  const { subtitleEntries, usingSrtParser2 } = useSubtitleParser(subtitleText);

  useEffect(() => {
    if (!videoEl || subtitleEntries.length === 0) return;
    
    const handleSubtitle = () => {
      const currentTime = videoEl.currentTime;
      let currentEntry: SubtitleEntry | undefined;
      
      if (usingSrtParser2) {
        // Using SrtParser2 format (seconds)
        currentEntry = subtitleEntries.find(
          (entry) =>
            (entry as SrtParser2Entry).startSeconds <= currentTime + delayTime * -0.001 &&
            (entry as SrtParser2Entry).endSeconds >= currentTime + delayTime * -0.001
        );
      } else {
        // Using @plussub/srt-vtt-parser format (milliseconds)
        currentEntry = subtitleEntries.find(
          (entry) =>
            (entry as PlusSubEntry).from <= currentTime * 1000 + delayTime * -1 &&
            (entry as PlusSubEntry).to >= currentTime * 1000 + delayTime * -1
        );
      }
      
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
    
    return () => {
      videoEl.removeEventListener('timeupdate', handleSubtitle);
    };
  }, [subtitleEntries, usingSrtParser2, delayTime, videoEl]);

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