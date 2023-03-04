import * as React from 'react';
import {
  defaultSubtitleSettings,
  useSubtitleSettings,
} from '../../../../contexts/SubtitleSettingsContext';
import { useVideoProps } from '../../../../contexts/VideoPropsContext';
import SettingsIcon from '../../../icons/SettingsIcon';
import NestedMenu from '../../../NestedMenu';
import { SubMenuProps } from '../../../NestedMenu/NestedMenu';
import SubtitleBackgroundOpacity from './SubtitleBackgroundOpacity';
import SubtitleFontOpacity from './SubtitleFontOpacity';
import SubtitleFontSize from './SubtitleFontSize';
import SubtitleSyncSub from './SubtitleSyncSub';
import SubtitleTextStyle from './SubtitleTextStyle';

const SubtitleSettings: React.FC<Partial<SubMenuProps>> = (props) => {
  const { setState, setDelayTime } = useSubtitleSettings();
  const { i18n } = useVideoProps();
  return (
    <NestedMenu.SubMenu
      {...props}
      menuKey="subtitle_settings"
      title={i18n.settings.subtitleSettings}
      icon={<SettingsIcon />}
      onChange={(val) => {
        if (val !== 'reset') return;
        setState(() => defaultSubtitleSettings);
        setDelayTime(0);
      }}
    >
      <SubtitleFontSize />
      <SubtitleBackgroundOpacity />
      <SubtitleTextStyle />
      <SubtitleFontOpacity />
      <SubtitleSyncSub />
      <NestedMenu.Item
        itemKey="reset"
        title={i18n.settings.reset}
        value="reset"
      ></NestedMenu.Item>
    </NestedMenu.SubMenu>
  );
};

export default React.memo(SubtitleSettings);
