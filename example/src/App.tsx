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
            lang: "(PT v1) TWD1X1",
            language: "(PT v1) TWD1X1",
            file: "https://sub.wyzie.ru/c/19e10c61/id/1952597846?format=srt&encoding=CP1252",
          },
          {
            lang: "(EN v1) TWD1X1",
            language: "(EN v1) TWD1X1",
            file: "https://sub.wyzie.ru/c/19b00c55/id/1961741348?format=srt&encoding=UTF-8",
          },
          {
            lang: "(PT BR v1) ERROR",
            language: "(PT BR v1) ERROR",
            file: "https://sub.wyzie.ru/c/19a50c51/id/1952608045?format=srt&encoding=CP1252",
          }
        ]}
      className="object-contain w-full h-full"
      thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
      autoPlay
    />
  )
}

export default App
