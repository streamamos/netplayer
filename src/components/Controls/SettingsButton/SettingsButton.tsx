import * as React from 'react';
import { isDesktop, isMobile } from 'react-device-detect';
import { PLAYER_CONTAINER_CLASS } from '../../../constants';
import { useVideoProps } from '../../../contexts/VideoPropsContext';
import Dialog from '../../Dialog';
import SettingsIcon from '../../icons/SettingsIcon';
import EditIcon from '../../icons/EditIcon';
import Popover from '../../Popover';
import ControlButton from '../ControlButton';
import styles from './HorizontalMenu.module.css';
import { useVideoState } from '../../../contexts/VideoStateContext';
import { useVideo } from '../../../contexts/VideoContext';
import { useSubtitleSettings, defaultSubtitleSettings } from '../../../contexts/SubtitleSettingsContext';
import SubtitleIcon from '../../icons/SubtitleIcon';
import QualityIcon from '../../icons/QualityIcon';
import PlaybackSpeedIcon from '../../icons/PlaybackSpeedIcon';
import SyncSubIcon from '../../icons/SyncSubIcon';
import FontSizeIcon from '../../icons/FontSizeIcon';
import OpacityIcon from '../../icons/OpacityIcon';
import FontStyleIcon from '../../icons/FontStyleIcon';
import FontOpacityIcon from '../../icons/FontOpacityIcon';

import CheckIcon from '../../icons/CheckIcon';
import ModalSyncSub from './SubtitleMenu/ModalSyncSub';
import SubtitleUpload from './SubtitleMenu/SubtitleUpload';

// Direct content components that bypass the NestedMenu navigation
const SubtitleContent = () => {
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

  const activeSubtitle = state.isSubtitleDisabled
    ? 'off'
    : !state.currentSubtitle
    ? state?.subtitles?.[0]?.lang
    : state.currentSubtitle;


  return (
    <div className={styles.directMenuContent}>
      
      <div 
        className={`${styles.menuItem} ${activeSubtitle === 'off' ? styles.activeMenuItem : ''}`}
        onClick={() => handleSubtitleChange('off')}
      >
        {activeSubtitle === 'off' && (
          <span className={styles.menuItemCheckIcon}>
            <CheckIcon />
          </span>
        )}
        <span>{i18n.settings.off}</span>
      </div>
      {state.subtitles.map((subtitle) => (
        <div
          key={subtitle.lang}
          className={`${styles.menuItem} ${activeSubtitle === subtitle.lang ? styles.activeMenuItem : ''}`}
          onClick={() => handleSubtitleChange(subtitle.lang)}
        >
          {activeSubtitle === subtitle.lang && (
            <span className={styles.menuItemCheckIcon}>
              <CheckIcon />
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {getLangSVG(subtitle.lang)}
            <p>{subtitle.language}</p>
          </span>
        </div>
      ))}
              <SubtitleUpload />
    </div>
  );
};

const QualityContent = () => {
  const { state, setState } = useVideoState();
  
  const handleQualityChange = (value: string) => {
    setState(() => ({ currentQuality: value }));
  };

  const activeQuality = state.currentQuality || state.qualities[0];

  return (
    <div className={styles.directMenuContent}>
      {state.qualities.map((quality, index) => (
        <div
          key={quality + index}
          className={`${styles.menuItem} ${activeQuality === quality ? styles.activeMenuItem : ''}`}
          onClick={() => handleQualityChange(quality)}
        >
          {activeQuality === quality && (
            <span className={styles.menuItemCheckIcon}>
              <CheckIcon />
            </span>
          )}
          <span>{quality}</span>
        </div>
      ))}
    </div>
  );
};


const SubtitleSettingsContent = () => {
  const { state, setState } = useSubtitleSettings();
  const { i18n } = useVideoProps();
  const { videoEl } = useVideo();

  const fontSizes = [0.5, 1, 1.5, 2];
  const opacities = [0, 50, 75, 100];
  const speeds = [0.25, 1, 1.5, 2];
  const currentSpeed = videoEl?.playbackRate || 1;

  const handleChangeSpeed = (value: number) => {
    if (!videoEl) return;
    videoEl.playbackRate = value;
  };

  const textStyles = [
    { key: 'none', label: i18n.settings.none },
    { key: 'outline', label: 'Contorno', style: { textShadow: 'black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px, black 0px 0px 3px' } },
    { key: 'raised', label: 'Elevado', style: { textShadow: 'black 0px 0px 5px, black 0px 1px 5px, black 0px 2px 5px' } },
    { key: 'dropShadow', label: 'Sombra', style: { textShadow: 'black 0px 2px 1px' } },
  ];

  return (
    <div className={styles.directMenuContent}>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><PlaybackSpeedIcon />{i18n.settings.playbackSpeed}</div>
        <div className={styles.optionsGrid}>
          {speeds.map((speed) => (
            <div
              key={speed}
              className={`${styles.menuItem} ${currentSpeed === speed ? styles.activeMenuItem : ''}`}
              onClick={() => handleChangeSpeed(speed)}
            >
              {currentSpeed === speed && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span>{`${speed}x`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><SyncSubIcon />{i18n.settings.subtitleSync}</div>
        <ModalSyncSub />
      </div>
    
    <div className={styles.subtitleSettingsSection}>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><FontSizeIcon />{i18n.settings.subtitleFontSize}</div>
        <div className={styles.optionsGrid}>
          {fontSizes.map((size) => (
            <div
              key={size}
              className={`${styles.menuItem} ${state.fontSize === size ? styles.activeMenuItem : ''}`}
              onClick={() => setState(() => ({ fontSize: size }))}
            >
              {state.fontSize === size && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span>{`${size * 100}%`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><OpacityIcon />{i18n.settings.subtitleBackgroundOpacity}</div>
        <div className={styles.optionsGrid}>
          {opacities.map((opacity) => (
            <div
              key={opacity}
              className={`${styles.menuItem} ${state.backgroundOpacity * 100 === opacity ? styles.activeMenuItem : ''}`}
              onClick={() => setState(() => ({ backgroundOpacity: opacity / 100 }))}
            >
              {state.backgroundOpacity * 100 === opacity && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span>{`${opacity}%`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><FontStyleIcon />{i18n.settings.subtitleTextStyle}</div>
        <div className={styles.optionsGrid}>
          {textStyles.map((style) => (
            <div
              key={style.key}
              className={`${styles.menuItem} ${state.textStyle === style.key ? styles.activeMenuItem : ''}`}
              onClick={() => setState(() => ({ textStyle: style.key as any }))}
            >
              {state.textStyle === style.key && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span style={style.style}>{style.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><FontOpacityIcon />{i18n.settings.subtitleFontOpacity}</div>
        <div className={styles.optionsGrid}>
          {opacities.map((opacity) => (
            <div
              key={opacity}
              className={`${styles.menuItem} ${state.fontOpacity * 100 === opacity ? styles.activeMenuItem : ''}`}
              onClick={() => setState(() => ({ fontOpacity: opacity / 100 }))}
            >
              {state.fontOpacity * 100 === opacity && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span>{`${opacity}%`}</span>
            </div>
          ))}
        </div>
      </div>

      <div 
        className={styles.menuItem}
        onClick={() => {
          setState(() => defaultSubtitleSettings);
        }}
      >
        <span>{i18n.settings.reset}</span>
      </div>

  </div>

    </div>
  );
};

const HorizontalMenu = React.memo(() => {
  const { i18n } = useVideoProps();
  const [activeTab, setActiveTab] = React.useState('subtitles');

  const tabs = [
    { key: 'subtitles', label: i18n.settings.subtitle, icon: <SubtitleIcon /> },
    { key: 'quality', label: i18n.settings.quality, icon: <QualityIcon /> },
    { key: 'settings', label: i18n.settings.subtitleSettings, icon: <EditIcon /> }
  ];

  return (
    <div 
      className={styles.horizontalContainer}
      style={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        maxHeight: '20rem',
        width: isMobile ? '100%' : '30rem',
        minHeight: '20rem',
        padding: isMobile ? '1rem' : '0.5rem',
      }}
    >
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            {tab.label}
          </div>
        ))}
      </div>
      <div className={styles.contentContainer}>
        {activeTab === 'subtitles' && <SubtitleContent />}
        {activeTab === 'settings' && <SubtitleSettingsContent />}
        {activeTab === 'quality' && <QualityContent />}
      </div>
    </div>
  );
});

HorizontalMenu.displayName = 'HorizontalMenu';

const selector = `.${PLAYER_CONTAINER_CLASS}`;

const SettingsButton = () => {
  const { i18n } = useVideoProps();
  return (
    <React.Fragment>
      {isMobile && (
        <Dialog
          portalSelector={selector}
          reference={
            <ControlButton>
              <SettingsIcon />
            </ControlButton>
          }
        >
          <HorizontalMenu />
        </Dialog>
      )}
      {isDesktop && (
        <Popover
          portalSelector={selector}
          reference={
            <ControlButton tooltip={i18n.controls.settings}>
              <SettingsIcon />
            </ControlButton>
          }
          position="top"
          overflowElement={selector}
        >
          <HorizontalMenu />
        </Popover>
      )}
    </React.Fragment>
  );
};

export default React.memo(SettingsButton);