import * as React from 'react';
import { useVideoProps } from '../../contexts/VideoPropsContext';
import { useVideoState } from '../../contexts/VideoStateContext';
import AudioIcon from '../icons/AudioIcon';
import SettingsButton from './SettingsButton';

const AudioButton = () => {
  const { state } = useVideoState();
  const { i18n } = useVideoProps();

  // Only appear if there's an array for audios and more than 1 option
  if (!state?.audios || state.audios.length <= 1) return null;

  return (
    <SettingsButton
      icon={<AudioIcon />}
      tooltip={i18n.settings.audio as string}
      initialTab="subtitles"
      initialScrollTo="audio"
    />
  );
};

export default React.memo(AudioButton);
