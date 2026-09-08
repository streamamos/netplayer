import React, { useState, useEffect, useMemo, useCallback } from 'react'
import NetPlayer from '../../src'

// ---------------------------------------------------------------------------
// Source presets — pick whichever config you want to test against NetPlayer.
// ---------------------------------------------------------------------------
type SourceMode = 'hls-multi' | 'hls-auto' | 'dash' | 'broken'

interface SourceItem {
  file: string
  label: string
}

interface SourcePreset {
  title: string
  description: string
  sources: SourceItem[]
}

const SOURCE_PRESETS: Record<SourceMode, SourcePreset> = {
  'hls-multi': {
    title: 'HLS — Multiple Qualities',
    description: 'Master playlist + explicit renditions, so you can test manual quality switching.',
    sources: [
      { file: 'https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8', label: 'auto' },
      { file: 'https://cdn.bitmovin.com/content/assets/sintel/hls/video/10000kbit.m3u8', label: '1744' },
      { file: 'https://cdn.bitmovin.com/content/assets/sintel/hls/video/6000kbit.m3u8', label: '818' },
      { file: 'https://cdn.bitmovin.com/content/assets/sintel/hls/video/250kbit.m3u8', label: '180' },
    ],
  },
  'hls-auto': {
    title: 'HLS — Auto Only',
    description: 'Single master playlist, letting ABR handle quality selection with no manual renditions.',
    sources: [
      { file: 'https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8', label: 'auto' },
    ],
  },
  dash: {
    title: 'DASH',
    description: 'MPEG-DASH manifest (Bitmovin public demo asset), for testing the DASH code path.',
    sources: [
      {
        file: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        label: 'auto',
      },
    ],
  },
  broken: {
    title: 'Broken Source',
    description: 'Deliberately invalid manifest URL, to test the player error/retry UI.',
    sources: [
      { file: 'https://invalid.example.com/does-not-exist/playlist.m3u8', label: 'auto' },
    ],
  },
}

const MODE_ORDER: SourceMode[] = ['hls-multi', 'hls-auto', 'dash', 'broken']

// ---------------------------------------------------------------------------
// Sample subtitle tracks — loaded manually via the "Load subtitles" button,
// so you can test injecting subtitles mid-playback rather than on a fixed timer.
// ---------------------------------------------------------------------------
const SAMPLE_SUBTITLES = [
  {
    lang: '(PT v2) TWD1X1',
    language: '(PT v2) TWD1X1',
    file: 'https://dl.opensubtitles.org/en/download/src-api/vrf-19cf0c5b/file/1961764907.srt',
  },
  {
    lang: '(PT v0) asd',
    language: '(PT v0) asd',
    file: 'https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252',
  },
  {
    lang: '(PT v2) 3441',
    language: '(PT v2) 3441',
    file: 'https://cca.megafiles.store/03/57/0357b2f774963019a8ea1e7689acb7e5/por-17.vtt',
  },
  {
    lang: '(PT v2) sss',
    language: '(PT v2) sss',
    file: 'https://dl.opensubtitles.org/en/download/src-api/vrf-19d50c5c/file/1961588454.ass',
  },
  {
    lang: '(EN v2) TWD1X1',
    language: '(EN v2) TWD1X1',
    file: 'https://sub.wyzie.ru/c/19b00c55/id/1961741348?format=srt&encoding=UTF-8',
  },
  {
    lang: '(PT BR v2) asdasd',
    language: '(PT BR v2) asdasd',
    file: 'https://sub.wyzie.ru/c/19a50c51/id/1952608045?format=srt&encoding=CP1252',
  },
  {
    lang: '(PT BR v2) ERROR',
    language: '(PT BR v2) ERROR',
    file: 'https://dl.opensubtitles.org/en/download/subencoding-utf8/src-api/vrf-19d50c5e/file/1961827955.ass',
  },
  {
    lang: '(PT BR v2) error on sub',
    language: '(PT BR v2) error on sub',
    file: 'https://dl.opensubtitles.org/en/download/subencoding-utf8/src-api/vrf-19d80c58/file/19568ssds32841.srt',
  },
  {
    lang: '(PT BR v2) err not found',
    language: '(PT BR v2) err not found',
    // intentionally malformed host, to exercise the "subtitle failed to load" path
    file: 'https://dl.opensubtsitles.org/en/download/subencoding-utf8/src-api/vrf-19d80c58/file/19568ssds32841.srt',
  },
  {
    lang: 'Portuguese (Sem Fonte)',
    language: 'Portuguese (Sem Fonte)',
    file: 'https://gist.githubusercontent.com/streamamos/239d3cb55bf6b3535dd11fba14b26178/raw/noSource.srt',
  },
]

const SKIP_SEGMENTS = {
  intro: { start_ms: null, end_ms: 10000, confidence: 0.25, submission_count: 1 },
  recap: { start_ms: null, end_ms: null, confidence: 0.25, submission_count: 1 },
  credits: { start_ms: 100000, end_ms: null, confidence: 0.25, submission_count: 1 },
}

// ---------------------------------------------------------------------------
// URL <-> mode persistence, so a link like ?mode=dash opens straight into
// that test case.
// ---------------------------------------------------------------------------
function readModeFromUrl(): SourceMode {
  if (typeof window === 'undefined') return 'hls-multi'
  const param = new URLSearchParams(window.location.search).get('mode')
  return (MODE_ORDER as string[]).includes(param || '') ? (param as SourceMode) : 'hls-multi'
}

function writeModeToUrl(mode: SourceMode) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('mode', mode)
  window.history.replaceState({}, '', url.toString())
}

// ---------------------------------------------------------------------------
// Debug overlay — tracks basic player status via NetPlayer callback props.
// NOTE: adjust the prop/callback names below (onReady, onPlay, onPause,
// onBuffer, onError, onQualityChange) to match NetPlayer's actual event API
// if these aren't the real prop names — swap them for whatever it exposes.
// ---------------------------------------------------------------------------
type PlayerStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'error'

interface DebugState {
  status: PlayerStatus
  quality?: string
  errorMessage?: string
}

const STATUS_COLORS: Record<PlayerStatus, string> = {
  loading: '#f5a623',
  ready: '#4caf7d',
  playing: '#4caf7d',
  paused: '#9a9aa2',
  buffering: '#f5a623',
  error: '#e5484d',
}

const DebugOverlay: React.FC<{ state: DebugState }> = ({ state }) => (
  <div
    style={{
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      fontSize: 12,
      color: '#f2f2f2',
      zIndex: 10,
      pointerEvents: 'none',
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[state.status],
        flexShrink: 0,
      }}
    />
    <span style={{ textTransform: 'capitalize' }}>{state.status}</span>
    {state.quality && <span style={{ color: '#9a9aa2' }}>· {state.quality}</span>}
    {state.errorMessage && <span style={{ color: '#e5484d' }}>· {state.errorMessage}</span>}
  </div>
)

// ---------------------------------------------------------------------------
// Source switcher control bar
// ---------------------------------------------------------------------------
const SourceSwitcher: React.FC<{
  mode: SourceMode
  onChange: (mode: SourceMode) => void
  autoPlay: boolean
  onAutoPlayChange: (value: boolean) => void
  onLoadSubtitles: () => void
  subtitlesLoaded: boolean
}> = ({ mode, onChange, autoPlay, onAutoPlayChange, onLoadSubtitles, subtitlesLoaded }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid #232326',
      backgroundColor: '#141416',
    }}
  >
    <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.4, color: '#9a9aa2', textTransform: 'uppercase' }}>
      Source
    </span>

    <div style={{ display: 'flex', gap: 8 }}>
      {MODE_ORDER.map((m) => {
        const active = m === mode
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: active ? '1px solid #6d5efc' : '1px solid #2b2b30',
              backgroundColor: active ? '#6d5efc' : 'transparent',
              color: active ? '#ffffff' : '#c7c7cf',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {SOURCE_PRESETS[m].title}
          </button>
        )
      })}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c7c7cf', cursor: 'pointer' }}>
        <input type="checkbox" checked={autoPlay} onChange={(e) => onAutoPlayChange(e.target.checked)} />
        Autoplay
      </label>

      <button
        onClick={onLoadSubtitles}
        disabled={subtitlesLoaded}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid #2b2b30',
          backgroundColor: subtitlesLoaded ? '#1c1c1f' : 'transparent',
          color: subtitlesLoaded ? '#5c5c63' : '#c7c7cf',
          fontSize: 13,
          cursor: subtitlesLoaded ? 'default' : 'pointer',
        }}
      >
        {subtitlesLoaded ? 'Subtitles loaded' : 'Load subtitles'}
      </button>
    </div>

    <span style={{ marginLeft: 'auto', fontSize: 13, color: '#7a7a82', maxWidth: 380, textAlign: 'right' }}>
      {SOURCE_PRESETS[mode].description}
    </span>
  </div>
)

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const App: React.FC = () => {
  const [mode, setMode] = useState<SourceMode>(() => readModeFromUrl())
  const [autoPlay, setAutoPlay] = useState(true)
  const [subtitles, setSubtitles] = useState<any[]>([])
  const [debugState, setDebugState] = useState<DebugState>({ status: 'loading' })
  const [showSkeleton, setShowSkeleton] = useState(true)

  const preset = useMemo(() => SOURCE_PRESETS[mode], [mode])

  const handleModeChange = useCallback((next: SourceMode) => {
    setMode(next)
    writeModeToUrl(next)
    setSubtitles([])
    setDebugState({ status: 'loading' })
    setShowSkeleton(true)
  }, [])

  // Fallback: clear the loading skeleton shortly after mount in case
  // NetPlayer doesn't fire an onReady-style callback.
  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 600)
    return () => clearTimeout(t)
  }, [mode])

  const handleLoadSubtitles = useCallback(() => {
    setSubtitles(SAMPLE_SUBTITLES)
  }, [])

  // --- NetPlayer callback wiring -------------------------------------------
  // Adjust these to whatever event props NetPlayer actually exposes.
  const handlePlay = useCallback(() => setDebugState((s) => ({ ...s, status: 'playing' })), [])
  const handlePause = useCallback(() => setDebugState((s) => ({ ...s, status: 'paused' })), [])
  const handleError = useCallback((err: any) => {
    setShowSkeleton(false)
    setDebugState({ status: 'error', errorMessage: err?.message || 'Failed to load source' })
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        backgroundColor: '#0b0b0d',
        color: '#f2f2f2',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <SourceSwitcher
        mode={mode}
        onChange={handleModeChange}
        autoPlay={autoPlay}
        onAutoPlayChange={setAutoPlay}
        onLoadSubtitles={handleLoadSubtitles}
        subtitlesLoaded={subtitles.length > 0}
      />

      <div style={{ flex: 1, padding: '32px', display: 'flex' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            margin: 'auto',
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <DebugOverlay state={debugState} />

          {showSkeleton && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b0b0d',
                color: '#5c5c63',
                fontSize: 14,
                zIndex: 5,
              }}
            >
              Loading player…
            </div>
          )}

          <NetPlayer
            // remount the player whenever the source preset changes
            key={mode}
            sources={preset.sources}
            subtitles={subtitles}
            skipsegments={SKIP_SEGMENTS}
            className="object-contain w-full h-full"
            thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
            autoPlay={autoPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}

export default App