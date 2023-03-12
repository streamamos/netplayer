import React from 'react'
import NetPlayer from '../../src'

const App: React.FC = () => {
  return (
    <NetPlayer
      sources={[
        {
          file: `http://localhost:3012/proxy?url=https://akm-cdn-play.loklok.tv/9e8aaacfe5d249bc926ff560dc4e4027/d687353b6e684791b80d19229376da0b-9c62f6a7a98097aabf20191a1e56e0ef-ld.m3u8?hdnts=exp=1678284574-acl=/*-hmac=a2a2ccf94f762569c27bb46ee5b37d7ef9646967e6de572343724c923ce63eb0`
        },
        { file: 'https://braflix-demo.vercel.app/blank.mp4' }
      ]}
      subtitles={[
        {
          lang: 'en',
          language: 'English',
          file: '"https://cc.2cdns.com/1d/d6/1dd6fec87138e9a1564692e882e46c18/eng-2.vtt",'
        },
        {
          lang: 'jp',
          language: 'Japanese',
          file: 'https://mbpimages.chuaxin.com/movie_box/tv/srt/1/7/12507/1389884/Kenan.and.Kel.S04E06.960p.WEB-DL.AAC2.0.H.264-squalor.srt'
        },
        {
          lang: 'cn',
          language: 'Chinese',
          file: 'https://artplayer.org/assets/sample/subtitle.cn.srt'
        }
      ]}
      className="object-contain w-full h-full"
      thumbnail="https://preview.zorores.com/8b/8bc17ab9537166f2abb7e0bef2b57e23/thumbnails/sprite.vtt"
      autoPlay
    />
  )
}

export default App
