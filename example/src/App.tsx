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
          file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
        },
        {
          lang: "(PT v0) asd",
          language: "(PT v0) asd",
          file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
        },
        {
          lang: "(PT v2) 3441",
          language: "(PT v2) 3441",
          file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
        },
        {
          lang: "(PT v2) sss",
          language: "(PT v2) sss",
          file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
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
        // {
        //   lang: "(PT BR v2) ERROR",
        //   language: "(PT BR v2) ERROR",
        //   file: "https://sub.wyzie.ru/c/19a50c51/id/1952608045?format=srt&encoding=CP1252",
        // },
        {
          lang: "(PT BR v2) sssss",
          language: "(PT BR v2) sssss",
          file: "https://sub.wyzie.ru/c/19a50c51/id/1952608045?format=srt&encoding=CP1252",
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
    <NetPlayer
      sources={[
        {
          file: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`,
          label: 'auto'
        },
        {
          file: `https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_fhd_7.m3u8`,
          label: '1080'
        },
        {
          file: `https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8`,
          label: '720'
        },
        {
          file: `https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8`,
          label: '480'
        },
        {
          file: `https://test-streams.mux.dev/x36xhzz/url_4/193039199_mp4_h264_aac_7.m3u8`,
          label: '288'
        },
        {
          file: `https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8`,
          label: '184'
        },
      ]}
      subtitles={subtitles}
      className="object-contain w-full h-full"
      thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
      autoPlay
    />
  )
}

export default App