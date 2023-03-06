import React from 'react'
import NetPlayer from '../../src'

const App: React.FC = () => {
  return (
    <NetPlayer
      sources={[
        {
          file: 'https://t-ca-2.24hoursuptodatecdn.net/_v10/ada7ee0f13c1079dd4e4655cd45f3928794cbec5483a36e06032de888ccb62b1a1c81736504fb569462e209b1cff9b7bc51455d613169be58784bec865d2d3fe06b0f147c45caea7ab75882b085b9ca1d9c5712db9b90ae45051643dc094dc74fa994e6d917a4339eb0423ea971a906de4d0a5f7c92198a24a26bd7f657ab998/1080/index.m3u8'
        }
      ]}
      subtitles={[
        {
          lang: 'jp',
          language: 'JapaneseJapaneseJapaneseJapaneseJapanese',
          file: 'https://cc.2cdns.com/5a/9c/5a9c8853f21c4c1c417608410c11dd15/5a9c8853f21c4c1c417608410c11dd15.vtt'
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
