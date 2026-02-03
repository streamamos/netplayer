import React, { useState, useEffect } from 'react'
import NetPlayer from '../../src'

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<any[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubtitles([
        {
          lang: "(PT v2) TWD1X1",
          language: "(PT v2) TWD1X1",
          file: "https://dl.opensubtitles.org/en/download/src-api/vrf-19cf0c5b/file/1961764907.srt",
        },
        {
          lang: "(PT v0) asd",
          language: "(PT v0) asd",
          file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
        },
        {
          lang: "(PT v2) 3441",
          language: "(PT v2) 3441",
          file: "https://cca.megafiles.store/03/57/0357b2f774963019a8ea1e7689acb7e5/por-17.vtt",
        },
        {
          lang: "(PT v2) sss",
          language: "(PT v2) sss",
          file: "https://dl.opensubtitles.org/en/download/src-api/vrf-19d50c5c/file/1961588454.ass",
        },
        {
          lang: "(EN v2) TWD1X1",
          language: "(EN v2) TWD1X1",
          file: "https://sub.wyzie.ru/c/19b00c55/id/1961741348?format=srt&encoding=UTF-8",
        },
        {
          lang: "(PT BR v2) asdasd",
          language: "(PT BR v2) asdasd",
          file: "https://sub.wyzie.ru/c/19a50c51/id/1952608045?format=srt&encoding=CP1252",
        },
        {
          lang: "(PT BR v2) ERROR",
          language: "(PT BR v2) ERROR",
          file: "https://dl.opensubtitles.org/en/download/subencoding-utf8/src-api/vrf-19d50c5e/file/1961827955.ass",
        },
        {
          lang: "(PT BR v2) error on sub",
          language: "(PT BR v2) error on sub",
          file: "https://dl.opensubtitles.org/en/download/subencoding-utf8/src-api/vrf-19d80c58/file/19568ssds32841.srt",
        },
        {
          lang: "(PT BR v2) err not found",
          language: "(PT BR v2) err not found",
          file: "https://dl.opensubtsitles.org/en/download/subencoding-utf8/src-api/vrf-19d80c58/file/19568ssds32841.srt",
        },
        {
          lang: "Portuguese (Sem Fonte)",
          language: "Portuguese (Sem Fonte)",
          file: "https://gist.githubusercontent.com/streamamos/239d3cb55bf6b3535dd11fba14b26178/raw/noSource.srt",
        },
      ])
    }, 5000) // 5 seconds delay

    // Cleanup function to clear the timeout if component unmounts
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ padding: '100px', backgroundColor: 'black', width: '100%', height: '100%' }}>
    <NetPlayer
      sources={[
        // {
        //   file: `https://small-cake-fdee.piracya.workers.dev/m3u8-proxy?url=https%3A%2F%2Fvixsrc.to%2Fplaylist%2F173365%3Fb%3D1%26token%3D7a5ed11898460bbdaba04d5ccb3b4926%26expires%3D1772674011%26h%3D1%26lang%3Den&headers=%7B%22Referer%22%3A%22https%3A%2F%2Fvixsrc.to%2Ftv%2F1399%2F1%2F1%22%2C%22User-Agent%22%3A%22Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit%2F537.36%22%7D`,
        //   label: 'auto'
        // },
        {
          file: `https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8`,
          label: 'auto'
        },
        // {
        //   file: `https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_fhd_7.m3u8`,
        //   label: '1080'
        // },
        // {
        //   file: `https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8`,
        //   label: '720'
        // },
        // {
        //   file: `https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8`,
        //   label: '480'
        // },
        // {
        //   file: `https://test-streams.mux.dev/x36xhzz/url_4/193039199_mp4_h264_aac_7.m3u8`,
        //   label: '288'
        // },
        // {
        //   file: `https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8`,
        //   label: '184'
        // },
      ]}
      subtitles={subtitles}
      skipsegments={{
        intro: {
          start_ms: null,
          end_ms: 10000,
          "confidence": 0.25,
          "submission_count": 1
        },
        recap: {
          start_ms: null,
          end_ms: null,
          "confidence": 0.25,
          "submission_count": 1
        },
        credits: {
          start_ms: 100000,
          end_ms: null,
          "confidence": 0.25,
          "submission_count": 1
        },
      }}
      className="object-contain w-full h-full"
      thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
      autoPlay
    />
    </div>
  )
}

export default App