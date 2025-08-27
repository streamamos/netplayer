import React from 'react'
import NetPlayer from '../../src'

const App: React.FC = () => {
  return (
    <NetPlayer
      sources={[
        {
          file: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
        }
      ]}
        subtitles={[
          {
            lang: "(PT v1) PORTUGUESE",
            language: "(PT v1) PORTUGUESE",
            file: "https://sub.wyzie.ru/c/19b00c55/id/1961741348?format=srt&encoding=UTF-8",
          },
          {
            lang: "(PT BR v1) PORTUGUESE",
            language: "(PT BR v1) PORTUGUESE",
            file: "https://dl.opensubtitles.org/en/download/src-api/vrf-19bc0c59/file/1961607936.ass",
          },
          {
            lang: "(EN v1) PORTUGUESE",
            language: "(EN v1) PORTUGUESE",
            file: "https://dl.opensubtitles.org/en/download/src-api/vrf-19bc0c59/file/1961607936.ass",
          }
        ]}
      className="object-contain w-full h-full"
      thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
      autoPlay
    />
  )
}

export default App
