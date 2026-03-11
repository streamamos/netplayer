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
import ColorIcon from '../../icons/ColorIcon';
import BlurIcon from '../../icons/BlurIcon';
import CheckIcon from '../../icons/CheckIcon';
import AudioIcon from '../../icons/AudioIcon';
import ModalSyncSub from './SubtitleMenu/ModalSyncSub';
import SubtitleUpload from './SubtitleMenu/SubtitleUpload';

import BrFlag from '../../icons/flags/BrFlag';
import PtFlag from '../../icons/flags/PtFlag';
import EnFlag from '../../icons/flags/EnFlag';
import NoFlag from '../../icons/flags/NoFlag';

import { colorToRgba } from '../../../utils/color';

// Direct content components that bypass the NestedMenu navigation
const SubtitleContent = ({ scrollToSubtitle }: { scrollToSubtitle: () => void }) => {
  const { state, setState } = useVideoState();
  const { i18n } = useVideoProps();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkSubtitles = () => {
      if (state.subtitles && state.subtitles.length > 0) {
        setLoading(false);
      } else {
        setLoading(true);
      }
    };

    const interval = setInterval(checkSubtitles, 50);
    return () => clearInterval(interval);
  }, [state.subtitles]);

  React.useEffect(() => {
    if (!loading) {
      scrollToSubtitle();
    }
  }, [loading]);

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

  const handleAudioChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      currentAudio: value,
    }));
  };

  const getLangSVG = (lang: string) => {
    if (lang.includes('BR v')) {
      return (
        <BrFlag style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }} />
      );
    } else if (lang.includes('PT v')) {
      return (
        <PtFlag style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }} />
      );
    } else if (lang.includes('EN v')) {
      return (
        <EnFlag style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }} />
      );
    } else if (lang.includes('Sem Fonte')) {
      return (
        <NoFlag style={{ width: 20, marginRight: 4, verticalAlign: 'middle' }} />
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

  const activeAudio = !state.currentAudio ? state?.audios?.[0]?.lang : state.currentAudio;

  return (
    <div className={styles.directMenuContent}>
      {state.audios.length > 1 && (
        <div className={styles.settingsSection} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
          <div className={styles.sectionTitle}><AudioIcon />{i18n.settings.audio}</div>
          <div className={styles.optionsGrid}>
            {state.audios.map((audio) => (
              <div
                key={audio.lang}
                className={`${styles.menuItem} ${activeAudio === audio.lang ? styles.activeMenuItem : ''}`}
                onClick={() => handleAudioChange(audio.lang)}
              >
                {activeAudio === audio.lang && (
                  <span className={styles.menuItemCheckIcon}></span>
                )}
                <span>{audio.language}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className={styles.infoText}>{i18n.settings.subtitleInfo}</p>
      <div 
        className={`${styles.menuItem} ${activeSubtitle === 'off' ? styles.activeMenuItem : ''}`}
        onClick={() => handleSubtitleChange('off')}
        data-lang="off"
      >
        {activeSubtitle === 'off' && (
          <span className={styles.menuItemCheckIcon}>
            <CheckIcon />
          </span>
        )}
        <span>{i18n.settings.off}</span>
      </div>
      {loading ? (
        <div className={styles.loader}>{i18n.settings.loading}</div>
      ) : (
        state.subtitles.map((subtitle) => (
          <div
            key={subtitle.lang}
            className={`${styles.menuItem} ${activeSubtitle === subtitle.lang ? styles.activeMenuItem : ''}`}
            onClick={() => handleSubtitleChange(subtitle.lang)}
            data-lang={subtitle.lang}
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
        ))
      )}
      <SubtitleUpload />
    </div>
  );
};

const QualityContent = () => {
  const { state, setState } = useVideoState();
  const { i18n } = useVideoProps();
  
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
          {quality === 'auto' && <p className={styles.qualityLabel}>{i18n.settings.recommended}</p>}
          {parseInt(quality) > 720 && <p className={styles.qualityLabel}>{i18n.settings.hd}</p>}
        </div>
      ))}
    </div>
  );
};


const SubtitleSettingsContent = () => {
  const { state, setState } = useSubtitleSettings();
  const { i18n } = useVideoProps();
  const { videoEl } = useVideo();

  const opacities = [0, 50, 75, 100];
  const speeds = [0.25, 1, 1.5, 2];
  const currentSpeed = videoEl?.playbackRate || 1;

  const colors = [
    { key: 'white', label: i18n.settings.white, style: { color: 'white' } },
    { key: 'yellow', label: i18n.settings.yellow, style: { color: 'yellow' } },
    { key: 'red', label: i18n.settings.red, style: { color: 'red' } },
    { key: 'lightBlue', label: i18n.settings.lightBlue, style: { color: 'lightblue' } },
  ];

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

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) / 100;
    setState(() => ({ fontSize: value }));
  };

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
          <div className={styles.sliderInputContainer}>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={state.fontSize * 100}
              onChange={handleFontSizeChange}
              className={styles.sliderInput}
            />
            <span>{`${Math.round(state.fontSize * 100)}%`}</span>
        </div>
      </div>

            <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}><ColorIcon />{i18n.settings.subtitleTextColor}</div>
        <div className={styles.optionsGrid}>
          {colors.map((color) => (
            <div
              key={color.key}
              className={`${styles.menuItem} ${state.textColor === color.key ? styles.activeMenuItem : ''}`}
              onClick={() => setState(() => ({ textColor: color.key as any }))}
            >
              {state.textColor === color.key && (
                <span className={styles.menuItemCheckIcon}></span>
              )}
              <span style={{ backgroundColor: colorToRgba(color.style.color, 1) }} className={styles.colorPreview}></span>
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
        <div className={styles.sectionTitle}><BlurIcon />{i18n.settings.subtitleBackgroundBlur}</div>
        <div className={`${styles.optionsGrid} ${styles.optionsGridBlur}`}>
          <div
            className={`${styles.menuItem} ${state.backgroundBlur ? styles.activeMenuItem : ''}`}
            onClick={() => setState(() => ({ backgroundBlur: true }))}
          >
            {state.backgroundBlur && (
              <span className={styles.menuItemCheckIcon}></span>
            )}
            <span>{i18n.settings.onBlur}</span>
          </div>
          <div
            className={`${styles.menuItem} ${!state.backgroundBlur ? styles.activeMenuItem : ''}`}
            onClick={() => setState(() => ({ backgroundBlur: false }))}
          >
            {!state.backgroundBlur && (
              <span className={styles.menuItemCheckIcon}></span>
            )}
            <span>{i18n.settings.offBlur}</span>
          </div>
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
  const contentRef = React.useRef<HTMLDivElement>(null);

  const scrollToSubtitle = () => {
    if (contentRef.current) {
      // Specifically target items with data-lang attribute (subtitles) that are also active
      const selectedSubtitle = contentRef.current.querySelector(`[data-lang].${styles.activeMenuItem}`);
      if (selectedSubtitle) {
        selectedSubtitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    if (contentRef.current) {
        if (tabKey === 'subtitles') {
            setTimeout(() => scrollToSubtitle(), 50); // Adding a slight delay to ensure DOM updates
        } else {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

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
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            {tab.label}
          </div>
        ))}
      </div>
      <div ref={contentRef} className={styles.contentContainer}>
        {activeTab === 'subtitles' && <SubtitleContent scrollToSubtitle={scrollToSubtitle} />}
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