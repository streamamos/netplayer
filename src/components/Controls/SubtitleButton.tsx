import * as React from 'react';
import { useVideoProps } from '../../contexts/VideoPropsContext';
import SubtitleIcon from '../icons/SubtitleIcon';
import SettingsButton from './SettingsButton';

const SubtitleButton = () => {
  const { i18n } = useVideoProps();

  return (
    <SettingsButton
      icon={<SubtitleIcon />}
      tooltip={i18n.settings.subtitle as string}
      initialTab="subtitles"
      initialScrollTo="subtitle"
    />
  );
};

export default React.memo(SubtitleButton);