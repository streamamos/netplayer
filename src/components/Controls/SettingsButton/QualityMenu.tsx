import * as React from 'react';
import { useVideoProps } from '../../../contexts/VideoPropsContext';
import { useVideoState } from '../../../contexts/VideoStateContext';
import QualityIcon from '../../icons/QualityIcon';
import NestedMenu from '../../NestedMenu';
import { isQualityAllowed } from '../../../utils';

const QualityMenu = () => {
  const { state, setState } = useVideoState();
  const { i18n, isVip } = useVideoProps();
  const handleQualityChange = (value: string) => {
    if (!isQualityAllowed(value, isVip)) return;
    setState(() => ({ currentQuality: value }));
  };
  return state.qualities.length ? (
    <NestedMenu.SubMenu
      menuKey="quality"
      title={i18n.settings.quality}
      activeItemKey={state.currentQuality || state.qualities[0]}
      icon={<QualityIcon />}
      onChange={handleQualityChange}
    >
      {state.qualities.map((quality, index) => {
        const allowed = isQualityAllowed(quality, isVip);
        return (
          <NestedMenu.Item
            key={quality + index}
            itemKey={quality}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                <span>{quality}</span>
                {!allowed && (
                  <span style={{
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 163, 26, 0.2)',
                    color: '#ffa31a',
                    border: '1px solid #ffa31a',
                    fontWeight: 600,
                  }}>
                    {i18n.settings.vipOnly}
                  </span>
                )}
              </div>
            }
            value={quality}
            style={!allowed ? {
              opacity: 0.5,
              cursor: 'not-allowed',
              pointerEvents: 'none',
            } : undefined}
          />
        );
      })}
    </NestedMenu.SubMenu>
  ) : null;
};

export default React.memo(QualityMenu);
