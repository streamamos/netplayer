import * as React from 'react';
import { useVideoProps } from '../../../../contexts/VideoPropsContext';
import { useVideoState } from '../../../../contexts/VideoStateContext';
import SubtitleIcon from '../../../icons/SubtitleIcon';
import NestedMenu from '../../../NestedMenu';
import SubtitleSettings from './SubtitleSettings';

const getLangSVG = (lang: string) => {
  if (lang.includes('BR v')) {
    return (
      <img
        src="https://flagicons.lipis.dev/flags/4x3/br.svg"
        alt="PT-BR"
        style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }}
      />
    );
  } else if (lang.includes('PT v')) {
    return (
      <img
        src="https://flagicons.lipis.dev/flags/4x3/pt.svg"
        alt="PT"
        style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }}
      />
    );
  } else if (lang.includes('EN v')) {
    return (
      <img
        src="https://flagicons.lipis.dev/flags/4x3/gb.svg"
        alt="EN"
        style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }}
      />
    );
  } else {
    return null;
  }
};

const SubtitleMenu = () => {
  const { state, setState } = useVideoState();
  const { i18n } = useVideoProps();
  const handleSubtitleChange = (value: string) => {
    if (value === 'off') {
      setState((prev) => ({
        ...prev,
        isSubtitleDisabled: true,
        currentSubtitle: null,
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      isSubtitleDisabled: false,
      currentSubtitle: value,
    }));
  };
  return state.subtitles.length ? (
    <NestedMenu.SubMenu
      menuKey="subtitles"
      title={i18n.settings.subtitle}
      activeItemKey={
        state.isSubtitleDisabled
          ? 'off'
          : !state.currentSubtitle
          ? state?.subtitles?.[0]?.lang
          : state.currentSubtitle
      }
      icon={<SubtitleIcon />}
      onChange={handleSubtitleChange}
    >
      <SubtitleSettings />
      <NestedMenu.Item itemKey="off" title={i18n.settings.off} value="off" />
      {state.subtitles.map((subtitle) => (
        <NestedMenu.Item
          key={subtitle.lang}
          itemKey={subtitle.lang}
          title={
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {getLangSVG(subtitle.lang)}
              <p>{subtitle.language}</p>
            </span>
          }
          value={subtitle.lang}
        />
      ))}
    </NestedMenu.SubMenu>
  ) : null;
};

export default React.memo(SubtitleMenu);
