import * as React from 'react';
import { useSubtitleSettings } from '../../../../contexts/SubtitleSettingsContext';
import { useVideoProps } from '../../../../contexts/VideoPropsContext';
import NestedMenu from '../../../NestedMenu';

const SubtitleBackgroundBlur = () => {
  const { state, setState } = useSubtitleSettings();
  const { i18n } = useVideoProps();

  const handleChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      backgroundBlur: value === 'on',
    }));
  };

  return (
    <NestedMenu.SubMenu
      menuKey="subtitle_background_blur"
      title={i18n.settings.subtitleBackgroundBlur}
      activeItemKey={state.backgroundBlur ? 'on' : 'off'}
      onChange={handleChange}
    >
      <NestedMenu.Item itemKey="on" title="On" value="on" />
      <NestedMenu.Item itemKey="off" title="Off" value="off" />
    </NestedMenu.SubMenu>
  );
};

export default React.memo(SubtitleBackgroundBlur);