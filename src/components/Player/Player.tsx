import * as React from 'react';
import { useVideoState } from '../../contexts/VideoStateContext';
import { Source } from '../../types';
import {
  NON_VIP_MAX_HEIGHT,
  clampQualityForVip,
  isQualityAllowed,
  parseNumberFromString,
} from '../../utils';
import styles from './Player.module.css';
import Hls from 'hls.js';
import DashJS from '../../types/dashjs';
import loadScript from '../../utils/load-script';

const HLS_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
const HLS_VARIABLE_NAME = 'Hls';
const DASH_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/dashjs@latest/dist/dash.all.min.js';
const DASH_VARIABLE_NAME = 'dashjs';

export interface PlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  sources: Source[];
  isVip?: boolean;
  debug?: boolean;
  hlsRef?: React.MutableRefObject<Hls | null>;
  dashRef?: React.MutableRefObject<DashJS.MediaPlayerClass | null>;
  hlsConfig?: Hls['config'];
  changeSourceUrl?: (currentSourceUrl: string, source: Source) => string;
  onHlsInit?: (hls: Hls, currentSource: Source) => void;
  onDashInit?: (dash: DashJS.MediaPlayerClass, currentSource: Source) => void;
  onInit?: (videoEl: HTMLVideoElement) => void;
  autoPlay?: boolean;
  preferQuality?: (qualities: string[]) => string;
}

const shouldPlayHls = (source: Source) =>
  source.file.includes('m3u8') || source.type === 'hls';

const shouldPlayDash = (source: Source) =>
  source.file.includes('mpd') || source.type === 'dash';

const noop = () => {};

const Player = React.forwardRef<HTMLVideoElement, PlayerProps>(
  (
    {
      sources,
      isVip,
      debug = false,
      children,
      hlsRef,
      dashRef,
      hlsConfig,
      changeSourceUrl,
      onHlsInit = noop,
      onDashInit = noop,
      onInit = noop,
      autoPlay = false,
      preferQuality,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLVideoElement>();
    const hls = React.useRef<Hls | null>(null);
    const dashjs = React.useRef<DashJS.MediaPlayerClass | null>(null);
    const dashReady = React.useRef<boolean>(false);
    const { state, setState } = useVideoState();
    const log = React.useCallback(
      (...args: any[]) => {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[NetPlayer:debug]', ...args);
        }
      },
      [debug]
    );
    const playerRef = React.useCallback(
      (node) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLVideoElement>).current = node;
        }
      },
      [ref]
    );
    const initQuality = React.useCallback(() => {
      const sortedAll = sources
        .filter((src) => !!src.label)
        .map((src) => src.label as string)
        .sort((a, b) => parseNumberFromString(b) - parseNumberFromString(a));
      const sortedUnique = [...Array.from(new Set<string>(sortedAll))];
      const firstQuality = clampQualityForVip(
        sortedAll[0],
        sortedUnique,
        isVip
      );
      log(
        '[initQuality] all labels=',
        sortedAll,
        '| unique=',
        sortedUnique,
        '| firstQuality=',
        firstQuality
      );
      setState(() => ({
        qualities: sortedUnique,
        currentQuality: firstQuality ?? sortedUnique.find(q => isQualityAllowed(q, isVip)) ?? null,
        actualPlayingQuality: firstQuality ?? sortedUnique.find(q => isQualityAllowed(q, isVip)) ?? null,
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, isVip, log]);
    const initPlayer = React.useCallback(
      async (source: Source) => {
        async function _initHlsPlayer() {
          const videoEl = innerRef.current;
          if (!videoEl) return;
          const HlsSDK = await loadScript<typeof Hls>(
            HLS_SCRIPT_URL,
            HLS_VARIABLE_NAME
          );
          if (!videoEl.isConnected) return;
          if (HlsSDK.isSupported()) {
            const _hls: Hls = new HlsSDK({
              xhrSetup: (xhr, url) => {
                const requestUrl = changeSourceUrl?.(url, source) || url;
                xhr.open('GET', requestUrl, true);
              },
              ...hlsConfig,
            });
            _hls.subtitleTrack = -1;
            _hls.subtitleDisplay = false;
            if (hlsRef) {
              hlsRef.current = _hls;
            }
            hls.current = _hls;
            _hls.attachMedia(videoEl);
            onHlsInit?.(_hls, source);
            _hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              _hls.loadSource(source.file);
              log('[HLS] source loaded:', source.file, '| isVip=', isVip);
              _hls.on(Hls.Events.MANIFEST_PARSED, () => {
                log(
                  '[HLS] MANIFEST_PARSED — levels=',
                  _hls.levels?.map(
                    (lv, i) =>
                      `#${i} ${lv.height}p ${Math.round(
                        (lv.bitrate || 0) / 1000
                      )}kbps`
                  ),
                  '| startLevel=',
                  _hls.startLevel,
                  '| currentLevel=',
                  _hls.currentLevel
                );
                if (autoPlay) {
                  videoEl
                    .play()
                    .catch(() =>
                      console.error(
                        'User must interact before playing the video.'
                      )
                    );
                }
                // Cap HLS ABR auto-switching at <= 1080 for non-VIP users.
                if (!isVip && _hls.levels?.length) {
                  const allowedIdx = _hls.levels.reduce(
                    (best: number, lv, idx) => {
                      if (!lv.height || lv.height > NON_VIP_MAX_HEIGHT) {
                        return best;
                      }
                      if (best === -1 || lv.height > _hls.levels[best].height!) {
                        return idx;
                      }
                      return best;
                    },
                    -1
                  );
                  if (allowedIdx >= 0) {
                    (_hls as any).autoLevelCapping = allowedIdx;
                    log(
                      '[HLS] non-VIP ABR cap: autoLevelCapping =',
                      allowedIdx,
                      `(${_hls.levels[allowedIdx].height}p)`
                    );
                    if (
                      _hls.currentLevel === -1 ||
                      !_hls.levels[_hls.currentLevel]?.height ||
                      _hls.levels[_hls.currentLevel].height! >
                        NON_VIP_MAX_HEIGHT
                    ) {
                      try {
                        _hls.currentLevel = allowedIdx;
                        log(
                          '[HLS] non-VIP: forced initial currentLevel =',
                          allowedIdx,
                          `(${_hls.levels[allowedIdx].height}p)`
                        );
                      } catch (_) {}
                    }
                  } else {
                    (_hls as any).autoLevelCapping = 0;
                    log(
                      '[HLS] non-VIP: no allowed level found, capping to index 0'
                    );
                  }
                }
                if (sources.length > 1) {
                  if (_hls.levels?.length) {
                    const currentLevelIdx =
                      _hls.currentLevel >= 0
                        ? _hls.currentLevel
                        : _hls.startLevel ?? -1;
                    if (currentLevelIdx >= 0 && _hls.levels[currentLevelIdx]?.height) {
                      const h = _hls.levels[currentLevelIdx].height;
                      const cappedH = isVip
                        ? h
                        : Math.min(h ?? NON_VIP_MAX_HEIGHT, NON_VIP_MAX_HEIGHT);
                      log(
                        '[HLS] multi-source initial actualPlayingQuality =',
                        `${cappedH}p`,
                        '| raw height=',
                        h
                      );
                      setState(() => ({
                        actualPlayingQuality: `${cappedH}`,
                      }));
                    }
                  }
                  return;
                }
                if (source.label) {
                  log('[HLS] using source label as single quality:', source.label);
                  setState((prev) => ({
                    qualities: [source.label!],
                    currentQuality: isQualityAllowed(source.label, isVip)
                      ? prev?.currentQuality || source.label!
                      : null,
                    actualPlayingQuality: isQualityAllowed(source.label, isVip)
                      ? source.label!
                      : prev?.actualPlayingQuality ?? null,
                  }));
                  return;
                }
                if (!_hls.levels?.length) return;
                const rawLevels: string[] = _hls.levels
                  .sort((a, b) => b.height - a.height)
                  .filter((level) => level.height)
                  .map((level) => `${level.height}`);
                const allowedLevels = rawLevels.filter(l => isQualityAllowed(l, isVip));
                const preferred = preferQuality?.(allowedLevels) || allowedLevels[0];
                const chosenPreferred = clampQualityForVip(
                  preferred,
                  rawLevels,
                  isVip
                );
                log(
                  '[HLS] single-playlist qualities =',
                  rawLevels,
                  '| allowed(isVip=' + isVip + ') =',
                  allowedLevels,
                  '| chosen =',
                  chosenPreferred
                );
                const targetIdx = chosenPreferred
                  ? _hls.levels.findIndex(
                      (lv) => `${lv.height}` === chosenPreferred
                    )
                  : -1;
                if (targetIdx >= 0) {
                  try {
                    _hls.currentLevel = targetIdx;
                    log(
                      '[HLS] set currentLevel =',
                      targetIdx,
                      `(${chosenPreferred}p)`
                    );
                  } catch (_) {}
                }
                const currentLevelIdx = _hls.currentLevel;
                const actualQualityHeight =
                  currentLevelIdx >= 0 && _hls.levels[currentLevelIdx]?.height
                    ? _hls.levels[currentLevelIdx].height
                    : null;
                const actualQuality = actualQualityHeight
                  ? `${
                      isVip
                        ? actualQualityHeight
                        : Math.min(actualQualityHeight, NON_VIP_MAX_HEIGHT)
                    }`
                  : chosenPreferred;
                log('[HLS] reporting actualPlayingQuality =', actualQuality);
                setState(() => ({
                  qualities: rawLevels,
                  currentQuality: chosenPreferred,
                  actualPlayingQuality: actualQuality,
                }));
              });
              _hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                const level = _hls.levels[data.level];
                if (level?.height) {
                  log(
                    '[HLS] LEVEL_SWITCHED: new level index=',
                    data.level,
                    '| raw height=',
                    `${level.height}p`,
                    '| bitrate=',
                    `${Math.round((level.bitrate || 0) / 1000)}kbps`
                  );
                  if (!isVip && level.height > NON_VIP_MAX_HEIGHT) {
                    const allowedIdx = _hls.levels.reduce(
                      (best: number, lv, idx) => {
                        if (!lv.height || lv.height > NON_VIP_MAX_HEIGHT) {
                          return best;
                        }
                        if (
                          best === -1 ||
                          lv.height > _hls.levels[best].height!
                        ) {
                          return idx;
                        }
                        return best;
                      },
                      -1
                    );
                    if (allowedIdx >= 0 && allowedIdx !== data.level) {
                      try {
                        _hls.currentLevel = allowedIdx;
                        log(
                          '[HLS] non-VIP: level exceeded cap, switching to index=',
                          allowedIdx,
                          `(${_hls.levels[allowedIdx].height}p)`
                        );
                      } catch (_) {}
                    }
                    const clampedH =
                      allowedIdx >= 0 && _hls.levels[allowedIdx]?.height
                        ? _hls.levels[allowedIdx].height!
                        : NON_VIP_MAX_HEIGHT;
                    setState(() => ({
                      actualPlayingQuality: `${Math.min(
                        clampedH,
                        NON_VIP_MAX_HEIGHT
                      )}`,
                    }));
                    return;
                  }
                  const height = isVip
                    ? level.height
                    : Math.min(level.height, NON_VIP_MAX_HEIGHT);
                  log(
                    '[HLS] reporting actualPlayingQuality =',
                    `${height}p`
                  );
                  setState(() => ({
                    actualPlayingQuality: `${height}`,
                  }));
                }
              });
            });

            //----REMOVED THIS SECTIONS SO M3U8 EMBEDDED SUBTITLES WONT OVERRIDE EXTERNAL SUBTITLES----

            // _hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, event) => {
            //   const modifiedSubtitles = event.subtitleTracks.map(
            //     (track, index) => ({
            //       file: track.details?.fragments?.[0].url || track.url,
            //       lang: track.lang || index.toString(),
            //       language: track.name,
            //     })
            //   );
            //   setState(() => ({
            //     subtitles: modifiedSubtitles,
            //     currentSubtitle: modifiedSubtitles[0]?.lang,
            //   }));
            // });
            _hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, event) => {
              const nameCount = new Map<string, number>();
              const modifiedAudios = event.audioTracks.map((track, index) => {
                const baseName = track.name || track.lang || 'Audio';
                const count = nameCount.get(baseName) || 0;
                nameCount.set(baseName, count + 1);

                const languageName =
                  count > 0 ? `${baseName} ${count + 1}` : baseName;

                return {
                  lang: `${track.lang || 'audio'}-${index}`,
                  language: languageName,
                };
              });

              setState((prev) => {
                 const currentAudio = prev.currentAudio;
                 let matchedAudio = modifiedAudios.find(
                   (a) => a.lang === currentAudio
                 );

                 // If no exact match (e.g. index changed between episodes), try matching by base language
                 if (!matchedAudio && currentAudio) {
                   const baseLang = currentAudio.split('-')[0];
                   matchedAudio = modifiedAudios.find(
                     (a) => a.lang.split('-')[0] === baseLang
                   );
                 }

                 return {
                   ...prev,
                   audios: modifiedAudios,
                   currentAudio: matchedAudio
                     ? matchedAudio.lang
                     : modifiedAudios[_hls.audioTrack >= 0 ? _hls.audioTrack : 0]
                         ?.lang || null,
                 };
               });
            });
            _hls.on(Hls.Events.ERROR, function (event, data) {
              console.log('ERROR:', event, data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    _hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    _hls.recoverMediaError();
                    break;
                }
              }
            });
          } else if (
            videoEl.canPlayType('application/vnd.apple.mpegurl')
          ) {
            videoEl.src = source.file;
          }
        }
        async function _initDashPlayer() {
          const videoEl = innerRef.current;
          if (!videoEl) return;
          const DashSDK = await loadScript<typeof DashJS>(
            DASH_SCRIPT_URL,
            DASH_VARIABLE_NAME
          );
          if (!videoEl.isConnected) return;
          dashReady.current = false;
          const player = DashSDK.MediaPlayer().create();
          dashjs.current = player;
          if (dashRef) {
            dashRef.current = player;
          }
          const useSourceLabel = !!source.label && sources.length === 1;
          let allowedBitrateApplied = false;
          const applyNonVipDashBitrateCap = (
            bitrates: DashJS.BitrateInfo[]
          ) => {
            if (allowedBitrateApplied || isVip) return;
            if (!bitrates?.length) return;
            try {
              const allowedBitrate = bitrates.reduce(
                (best: number, br) => {
                  if (!br.height || br.height > NON_VIP_MAX_HEIGHT) {
                    return best;
                  }
                  if (best === -1 || br.height > bitrates[best].height) {
                    return br.qualityIndex;
                  }
                  return best;
                },
                -1
              );
              if (allowedBitrate >= 0) {
                try {
                  player.setQualityFor('video', allowedBitrate);
                  log(
                    '[DASH] non-VIP: setQualityFor(video,',
                    allowedBitrate,
                    `) = ${bitrates[allowedBitrate].height}p`
                  );
                } catch (_) {}
                try {
                  // Limit ABR to the maximum allowed bitrate index to prevent
                  // switching above 1080p for non-VIP users.
                  const playerAny = player as any;
                  if (typeof playerAny.setMaxAllowedBitrateFor === 'function') {
                    playerAny.setMaxAllowedBitrateFor(
                      'video',
                      bitrates[allowedBitrate].bitrate
                    );
                    log(
                      '[DASH] non-VIP: setMaxAllowedBitrateFor(video) =',
                      bitrates[allowedBitrate].bitrate,
                      `bps (${bitrates[allowedBitrate].height}p)`
                    );
                  }
                } catch (_) {}
              }
              allowedBitrateApplied = true;
            } catch (err) {
              console.warn('Dash non-VIP bitrate cap failed:', err);
            }
          };
          const handleStreamInitialized = () => {
            try {
              if (!player || dashjs.current !== player) return;
              const bitrates = player.getBitrateInfoListFor('video');
              if (!bitrates?.length) return;
              log(
                '[DASH] streamInitialized — bitrates=',
                bitrates.map(
                  (br) =>
                    `#${br.qualityIndex} ${br.height}p ${Math.round(
                      br.bitrate / 1000
                    )}kbps`
                ),
                '| isVip=',
                isVip
              );
              dashReady.current = true;
              applyNonVipDashBitrateCap(bitrates);
              if (sources.length > 1) {
                const currentIdx = player.getQualityFor('video');
                if (currentIdx >= 0 && bitrates[currentIdx]?.height) {
                  const h = bitrates[currentIdx].height;
                  const cappedH = isVip
                    ? h
                    : Math.min(h, NON_VIP_MAX_HEIGHT);
                  log(
                    '[DASH] multi-source initial actualPlayingQuality =',
                    `${cappedH}p`,
                    '| raw height=',
                    h
                  );
                  setState(() => ({
                    actualPlayingQuality: `${cappedH}`,
                  }));
                }
                return;
              }
              if (useSourceLabel) {
                log('[DASH] using source label as single quality:', source.label);
                setState((prev) => ({
                  qualities: [source.label!],
                  currentQuality: isQualityAllowed(source.label, isVip)
                    ? prev?.currentQuality || source.label!
                    : null,
                  actualPlayingQuality: isQualityAllowed(source.label, isVip)
                    ? source.label!
                    : prev?.actualPlayingQuality ?? null,
                }));
              } else {
                const rawQualities = bitrates.map(
                  (bitrate) => bitrate.height.toString()
                );
                const allowedQualities = rawQualities.filter(q => isQualityAllowed(q, isVip));
                log(
                  '[DASH] single-manifest qualities =',
                  rawQualities,
                  '| allowed(isVip=' + isVip + ') =',
                  allowedQualities
                );
                const bestQuality = (() => {
                  const qString =
                    state.currentQuality || preferQuality?.(allowedQualities);
                  const clampedQ = clampQualityForVip(
                    qString,
                    rawQualities,
                    isVip
                  );
                  const quality = clampedQ
                    ? bitrates.find(
                        (bitrate) =>
                          bitrate.height === parseNumberFromString(clampedQ)
                      )
                    : undefined;
                  if (quality) return quality;
                  // Best allowed for non-VIP, else highest overall
                  const eligible = isVip
                    ? bitrates
                    : bitrates.filter(
                        (br) => br.height && br.height <= NON_VIP_MAX_HEIGHT
                      );
                  if (!eligible.length) return bitrates[bitrates.length - 1];
                  return eligible[eligible.length - 1];
                })();
                if (
                  bestQuality &&
                  (bestQuality.qualityIndex === 0 || bestQuality.qualityIndex)
                ) {
                  const selectedIndex = isVip
                    ? bestQuality.qualityIndex
                    : bestQuality.height &&
                        bestQuality.height <= NON_VIP_MAX_HEIGHT
                      ? bestQuality.qualityIndex
                      : (() => {
                          const allowed = bitrates
                            .filter(
                              (br) =>
                                br.height && br.height <= NON_VIP_MAX_HEIGHT
                            )
                            .sort((a, b) => b.height - a.height);
                          return allowed.length
                            ? allowed[0].qualityIndex
                            : 0;
                        })();
                  try {
                    player.setQualityFor('video', selectedIndex);
                    log(
                      '[DASH] setQualityFor(video,',
                      selectedIndex,
                      ') =',
                      bestQuality?.height + 'p'
                    );
                  } catch (err) {
                    console.warn('Dash setQualityFor failed:', err);
                  }
                }
                const currentIdx = player.getQualityFor('video');
                const rawActual =
                  (currentIdx >= 0 && bitrates[currentIdx]?.height?.toString()) ||
                  bestQuality?.height?.toString() ||
                  allowedQualities[0];
                const actualHeight =
                  rawActual && isVip
                    ? rawActual
                    : rawActual
                      ? `${Math.min(
                          parseNumberFromString(rawActual) ||
                            NON_VIP_MAX_HEIGHT,
                          NON_VIP_MAX_HEIGHT
                        )}`
                      : rawActual;
                log('[DASH] reporting actualPlayingQuality =', actualHeight);
                setState((prev) => ({
                  qualities: rawQualities,
                  currentQuality:
                    clampQualityForVip(
                      prev?.currentQuality ||
                        bestQuality?.height?.toString() ||
                        allowedQualities[0],
                      rawQualities,
                      isVip
                    ) || allowedQualities[0] || null,
                  actualPlayingQuality: actualHeight,
                }));
              }
            } catch (err) {
              console.warn('Dash stream init handler failed:', err);
            }
          };
          const handleQualityChanged = (e: any) => {
            try {
              if (!player || dashjs.current !== player) return;
              if (e.mediaType !== 'video') return;
              const bitrates = player.getBitrateInfoListFor('video');
              if (!bitrates?.length) return;
              let idx = e.newQuality ?? player.getQualityFor('video');
              if (idx >= 0) {
                const rawBr = bitrates[idx];
                log(
                  '[DASH] qualityChanged: newQuality idx=',
                  idx,
                  rawBr
                    ? `| raw=${rawBr.height}p ${Math.round(
                        rawBr.bitrate / 1000
                      )}kbps`
                    : ''
                );
                applyNonVipDashBitrateCap(bitrates);
                if (!isVip) {
                  const br = bitrates[idx];
                  if (br?.height && br.height > NON_VIP_MAX_HEIGHT) {
                    const allowed = bitrates
                      .filter(
                        (b) => b.height && b.height <= NON_VIP_MAX_HEIGHT
                      )
                      .sort((a, b) => b.height - a.height);
                    if (allowed.length) {
                      const safeIdx = allowed[0].qualityIndex;
                      if (safeIdx !== idx) {
                        try {
                          player.setQualityFor('video', safeIdx);
                          log(
                            '[DASH] non-VIP: quality exceeded cap, switching to idx=',
                            safeIdx,
                            `(${allowed[0].height}p)`
                          );
                        } catch (_) {}
                        idx = safeIdx;
                      }
                    }
                  }
                }
                const br = bitrates[idx];
                if (br?.height) {
                  const height = isVip
                    ? br.height
                    : Math.min(br.height, NON_VIP_MAX_HEIGHT);
                  log(
                    '[DASH] reporting actualPlayingQuality =',
                    `${height}p`
                  );
                  setState(() => ({
                    actualPlayingQuality: `${height}`,
                  }));
                }
              }
            } catch (err) {
              console.warn('Dash quality change handler failed:', err);
            }
          };
          player.on(
            'streamInitialized',
            handleStreamInitialized
          );
          player.on(
            'qualityChanged',
            handleQualityChanged
          );
          player.updateSettings({
            streaming: { abr: { autoSwitchBitrate: { video: useSourceLabel } } },
          });
          player.initialize();
          player.setAutoPlay(autoPlay || false);
          player.attachView(videoEl);
          player.attachSource(source.file);
          log('[DASH] attached source:', source.file, '| isVip=', isVip);
          onDashInit?.(player, source);
        }
        const videoEl = innerRef.current;
        if (!videoEl) return;
        onInit?.(videoEl);
        if (hls.current) {
          try {
            hls.current.destroy();
          } catch (err) {
            console.warn('Hls destroy failed:', err);
          }
          hls.current = null;
        }
        if (dashjs.current) {
          try {
            dashjs.current.reset();
          } catch (err) {
            console.warn('Dash reset failed:', err);
          }
          dashjs.current = null;
        }
        dashReady.current = false;
        if (shouldPlayHls(source)) {
          log('[initPlayer] selecting HLS path for source =', source);
          _initHlsPlayer();
        } else if (shouldPlayDash(source)) {
          log('[initPlayer] selecting DASH path for source =', source);
          _initDashPlayer();
        } else {
          // For direct files (mp4, etc.), non-VIP users must never be served
          // a > 1080p source.  Look up the best allowed source and swap.
          const allowedSource: Source = (() => {
            if (isVip || !source.label || isQualityAllowed(source.label, isVip)) {
              return source;
            }
            const bestAllowed = sources
              .filter(
                (s) => !!s.label && isQualityAllowed(s.label, isVip)
              )
              .sort(
                (a, b) =>
                  parseNumberFromString(b.label!) -
                  parseNumberFromString(a.label!)
              )[0];
            log(
              '[initPlayer] direct: requested source ',
              source.label,
              ' not allowed for non-VIP, falling back to',
              bestAllowed?.label ?? source.label
            );
            return bestAllowed || source;
          })();
          log(
            '[initPlayer] selecting direct-file path for source =',
            allowedSource,
            '| isVip=',
            isVip
          );
          if (videoEl.src) {
            videoEl.pause();
          }
          videoEl.src = allowedSource.file;
          videoEl.load();
          if (allowedSource.label) {
            setState((prev) => {
              const q = isQualityAllowed(allowedSource.label, isVip)
                ? allowedSource.label!
                : prev?.actualPlayingQuality ?? null;
              log(
                '[initPlayer] direct: reporting actualPlayingQuality / currentQuality =',
                q
              );
              return {
                actualPlayingQuality: q,
                currentQuality: isQualityAllowed(allowedSource.label, isVip)
                  ? allowedSource.label!
                  : prev?.currentQuality ?? null,
              };
            });
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [sources, isVip]
    );
    React.useEffect(() => {
      const cancelled = { current: false };
      const allowedCurrentQuality = clampQualityForVip(
        state?.currentQuality,
        sources.filter((s) => !!s.label).map((s) => s.label!),
        isVip
      );
      const source =
        (allowedCurrentQuality
          ? sources.find((source) => source.label === allowedCurrentQuality)
          : undefined) ||
        (() => {
          const fallback = sources
            .filter((s) => !s.label || isQualityAllowed(s.label, isVip))
            .sort((a, b) => {
              if (!a.label) return 1;
              if (!b.label) return -1;
              return (
                parseNumberFromString(b.label!) -
                parseNumberFromString(a.label!)
              );
            });
          return fallback[0] || sources[0];
        })();
      log(
        '[mountEffect] initial source pick: currentQuality=',
        state?.currentQuality,
        '| clamped=',
        allowedCurrentQuality,
        '| selected source=',
        source,
        '| isVip=',
        isVip
      );
      initPlayer(source);
      // If the sources have multiple m3u8 urls, then we have to handle quality ourself (because hls.js only handle quality with playlist url).
      // Same with the sources that have multiple mp4 urls.
      if (!shouldPlayHls(source) || sources.length > 1) {
        initQuality();
      }
      return () => {
        cancelled.current = true;
        if (hls.current) {
          try {
            hls.current.destroy();
          } catch (err) {
            console.warn('Hls destroy failed:', err);
          }
          hls.current = null;
        }
        if (dashjs.current) {
          try {
            dashjs.current.reset();
          } catch (err) {
            console.warn('Dash reset failed:', err);
          }
          dashjs.current = null;
        }
        dashReady.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, isVip]);
    React.useEffect(() => {
      const videoRef = innerRef.current;
      if (!videoRef) return;
      if (!state?.qualities.length) return;
      const rawCurrentQuality = state?.currentQuality;
      const currentQuality = clampQualityForVip(
        rawCurrentQuality,
        state?.qualities || [],
        isVip
      );
      const sourceLabelList = sources
        .filter((s) => !!s.label)
        .map((s) => s.label!);
      const safeSourceLabel = clampQualityForVip(
        currentQuality,
        sourceLabelList,
        isVip
      );
      const source =
        (safeSourceLabel
          ? sources.find((s) => s.label === safeSourceLabel)
          : undefined) || sources[0];
      log(
        '[currentQuality] quality changed:',
        rawCurrentQuality,
        '| clamped for menu=',
        currentQuality,
        '| clamped for sources=',
        safeSourceLabel,
        '| resolved source=',
        source
      );
      // If the sources contain only one m3u8 url, then it maybe is a playlist.
      if (shouldPlayHls(source) && sources.length === 1) {
        if (!hls?.current?.levels?.length) return;
        if (!currentQuality) return;
        const targetHeight = parseNumberFromString(currentQuality);
        if (!Number.isFinite(targetHeight)) return;
        let index = hls.current.levels.findIndex(
          (level) => level.height === targetHeight
        );
        // Non-VIP: ensure the chosen index is within the allowed set. If the
        // target somehow exceeds 1080p, fall back to the best legal level.
        if (!isVip && index >= 0) {
          const lv = hls.current.levels[index];
          if (lv?.height && lv.height > NON_VIP_MAX_HEIGHT) {
            const allowedIdx = hls.current.levels.reduce(
              (best: number, lv, idx) => {
                if (!lv.height || lv.height > NON_VIP_MAX_HEIGHT) return best;
                if (
                  best === -1 ||
                  lv.height > hls.current!.levels[best].height!
                ) {
                  return idx;
                }
                return best;
              },
              -1
            );
            log(
              '[currentQuality][HLS] non-VIP: target index',
              index,
              `(${lv.height}p) exceeds cap, clamping to`,
              allowedIdx,
              allowedIdx >= 0 && hls.current?.levels[allowedIdx]?.height
                ? `(${hls.current.levels[allowedIdx].height}p)`
                : ''
            );
            index = allowedIdx;
          }
        }
        if (index === -1) return;
        try {
          hls.current.currentLevel = index;
          log(
            '[currentQuality][HLS] set currentLevel =',
            index,
            hls.current?.levels[index]?.height
              ? `(${hls.current.levels[index].height}p)`
              : ''
          );
        } catch (_) {}
        const selectedLevel = hls.current.levels[index];
        if (selectedLevel?.height) {
          const reportedHeight = isVip
            ? selectedLevel.height
            : Math.min(selectedLevel.height, NON_VIP_MAX_HEIGHT);
          setState(() => ({
            actualPlayingQuality: `${reportedHeight}`,
          }));
        }
        return;
      }
      if (shouldPlayDash(source) && sources.length === 1) {
        if (!dashjs.current) return;
        if (!dashReady.current) return;
        let bitrates: DashJS.BitrateInfo[] = [];
        try {
          bitrates = dashjs.current.getBitrateInfoListFor('video');
        } catch (err) {
          console.warn('Dash getBitrateInfoListFor failed:', err);
          return;
        }
        if (!bitrates?.length) return;
        if (!currentQuality) return;
        const targetHeight = parseNumberFromString(currentQuality);
        let choseBitrate = bitrates.find(
          (bitrate) => bitrate.height === targetHeight
        );
        if (!choseBitrate && Number.isFinite(targetHeight)) {
          // Non-VIP clamp: if the requested quality isn't allowed, pick the
          // best available allowed bitrate.
          const eligible = isVip
            ? bitrates
            : bitrates.filter(
                (br) => br.height && br.height <= NON_VIP_MAX_HEIGHT
              );
          if (!eligible.length) return;
          choseBitrate = eligible.sort((a, b) => b.height - a.height)[0];
          log(
            '[currentQuality][DASH] exact match not found, picked best eligible =',
            choseBitrate.height + 'p'
          );
        } else if (!isVip && choseBitrate) {
          if (
            choseBitrate.height &&
            choseBitrate.height > NON_VIP_MAX_HEIGHT
          ) {
            const eligible = bitrates.filter(
              (br) => br.height && br.height <= NON_VIP_MAX_HEIGHT
            );
            if (!eligible.length) return;
            const clamped = eligible.sort((a, b) => b.height - a.height)[0];
            log(
              '[currentQuality][DASH] non-VIP: target',
              choseBitrate.height + 'p',
              'exceeds cap, clamping to',
              clamped.height + 'p'
            );
            choseBitrate = clamped;
          }
        }
        if (!choseBitrate?.qualityIndex && choseBitrate?.qualityIndex !== 0) {
          return;
        }
        try {
          dashjs.current.setQualityFor('video', choseBitrate.qualityIndex);
          log(
            '[currentQuality][DASH] setQualityFor(video) = qualityIndex',
            choseBitrate.qualityIndex,
            `(${choseBitrate.height}p)`
          );
        } catch (err) {
          console.warn('Dash setQualityFor failed:', err);
        }
        if (choseBitrate?.height) {
          const reportedHeight = isVip
            ? choseBitrate.height
            : Math.min(choseBitrate.height, NON_VIP_MAX_HEIGHT);
          setState(() => ({
            actualPlayingQuality: reportedHeight.toString(),
          }));
        }
        return;
      }
      // Direct file switching (multiple mp4 sources / multiple non-playlist sources)
      const beforeChangeTime = videoRef.currentTime;
      const requestedSource = safeSourceLabel
        ? sources.find((s) => s.label === safeSourceLabel)
        : undefined;
      // Non-VIP guard: only ever switch to an allowed direct-file source.
      // If the requested one isn't allowed, fall back to the best allowed source.
      const qualitySource: Source | undefined = (() => {
        if (requestedSource) {
          if (
            !requestedSource.label ||
            isQualityAllowed(requestedSource.label, isVip)
          ) {
            return requestedSource;
          }
        }
        const bestAllowed = sources
          .filter((s) => !s.label || isQualityAllowed(s.label, isVip))
          .sort((a, b) => {
            if (!a.label) return 1;
            if (!b.label) return -1;
            return (
              parseNumberFromString(b.label) - parseNumberFromString(a.label)
            );
          });
        if (
          requestedSource?.label &&
          !isQualityAllowed(requestedSource.label, isVip)
        ) {
          log(
            '[currentQuality][direct] non-VIP: requested',
            requestedSource.label,
            'not allowed, falling back to',
            bestAllowed[0]?.label ?? 'none'
          );
        }
        return bestAllowed[0];
      })();
      if (!qualitySource) return;
      if (qualitySource.label) {
        const reportedLabel = isVip
          ? qualitySource.label
          : isQualityAllowed(qualitySource.label, isVip)
            ? qualitySource.label
            : null;
        if (reportedLabel) {
          log(
            '[currentQuality][direct] switching source to',
            qualitySource.label,
            '| reported actualPlayingQuality =',
            reportedLabel
          );
          setState(() => ({
            actualPlayingQuality: reportedLabel,
          }));
        }
      }
      initPlayer(qualitySource);
      const handleQualityChange = () => {
        videoRef.currentTime = beforeChangeTime;
        videoRef.play();
      };
      videoRef.addEventListener('canplay', handleQualityChange, {
        once: true,
      });
      return () => {
        videoRef.removeEventListener('canplay', handleQualityChange);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.currentQuality, isVip, sources]);
    React.useEffect(() => {
      const videoRef = innerRef.current;
      if (!videoRef) return;
      if (!state?.audios.length) return;
      if (!hls?.current) return;
      const currentAudio = state?.currentAudio;
      if (!currentAudio) return;
      const currentAudioTrack = state.audios.findIndex(
        (audio) => audio.lang === currentAudio
      );
      if (currentAudioTrack !== -1 && hls.current.audioTrack !== currentAudioTrack) {
        hls.current.audioTrack = currentAudioTrack;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.currentAudio, state?.audios]);
    return (
      <video
        ref={playerRef}
        autoPlay={autoPlay}
        preload="auto"
        className={styles.video}
        playsInline
        crossOrigin="anonymous"
        {...props}
      >
        {children}
      </video>
    );
  }
);

Player.displayName = 'Player';

export default Player;
