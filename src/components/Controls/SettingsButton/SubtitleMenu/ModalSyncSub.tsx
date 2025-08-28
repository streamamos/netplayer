import React, { useState } from 'react';
import { useSubtitleSettings, useVideoProps } from '../../../../contexts';
import IconMinusCircle from '../../../icons/MinusCircleIcon';
import IconPlusCircle from '../../../icons/PlusIconCircle';
import IconPlus from '../../../icons/IconPlus';
import MinusIcon from '../../../icons/MinusIcon';
import styles from './index.module.css';

const ModalSyncSub = () => {
  const { i18n } = useVideoProps();
  const { delayTime: delayTimeSetting, setDelayTime: setDelayTimeSetting } =
    useSubtitleSettings();
  const [delayTime, setDelayTime] = useState<string | number>(delayTimeSetting);

  // Update both local state and context immediately on change
  const handleDelayChange = (value: string) => {
    // Handle empty input or initial hyphen
    if (value === '-' || value === '') {
      setDelayTime(value);
      return;
    }

    const regex = new RegExp('^[+-]?[0-9]+(?:\\.[0-9]+)?$');
    if (regex.test(value)) {
      const numericValue = Number(value);
      setDelayTime(numericValue);
      setDelayTimeSetting(numericValue); // Update context immediately
    }
  };

  // Update handlers for buttons to update both local state and context
  const updateDelay = (newValue: number) => {
    setDelayTime(newValue);
    setDelayTimeSetting(newValue);
  };

  // Reset delay to 0
  const handleReset = () => {
    setDelayTime(0);
    setDelayTimeSetting(0);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalOverlay}></div>
      <div className={styles.modalContainer}>
        <div className={styles.modalControl}>
          <button onClick={() => updateDelay(Number(delayTime) - 1000)}>
            <IconMinusCircle style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
          <button onClick={() => updateDelay(Number(delayTime) - 100)}>
            <MinusIcon
              style={{ width: '1.6rem', height: '1.6rem', color: 'white' }}
            />
          </button>
          <input
            type="text"
            value={delayTime}
            className={styles.modalInput}
            onChange={(e) => handleDelayChange(e.target.value)}
          />
          <button onClick={() => updateDelay(Number(delayTime) + 100)}>
            <IconPlus style={{ width: '1.6rem', height: '1.6rem' }} />
          </button>
          <button onClick={() => updateDelay(Number(delayTime) + 1000)}>
            <IconPlusCircle style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
        </div>
         <div className={styles.modalButtons}>
           <button
            className={styles.modalButtonApply}
            onClick={handleReset}
          >
            {i18n.settings.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSyncSub;
