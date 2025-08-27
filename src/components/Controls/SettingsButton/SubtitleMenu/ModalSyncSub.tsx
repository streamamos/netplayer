import React, { useRef, useState } from 'react';
import { useSubtitleSettings } from '../../../../contexts';
import useClickOutside from '../../../../hooks/useClickOutside';
import IconMinusCircle from '../../../icons/MinusCircleIcon';
import IconPlusCircle from '../../../icons/PlusIconCircle';
import IconPlus from '../../../icons/IconPlus';
import MinusIcon from '../../../icons/MinusIcon';
import styles from './index.module.css';

const ModalSyncSub = ({ toggleModal }: any) => {
  const { delayTime: delayTimeSetting, setDelayTime: setDelayTimeSetting } =
    useSubtitleSettings();
  const modalRef = useRef<HTMLDivElement>(null);
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

  useClickOutside(modalRef, toggleModal);

  return (
    <div className={styles.modal}>
      <div className={styles.modalOverlay}></div>
      <div className={styles.modalContainer} ref={modalRef}>
        {/* <h2 className={styles.modalHeading}>
          {i18n.settings.subtitleSyncHeading}
        </h2>
        <span className={styles.modalTitle}>
          {Number(delayTime) === 0
            ? i18n.settings.subtitleSyncNoDelay
            : Number(delayTime) > 0
            ? stringInterpolate(i18n.settings.tooEarly, {
                miliseconds: Number(delayTime),
              })
            : stringInterpolate(i18n.settings.tooLate, {
                miliseconds: Number(delayTime),
              })}
        </span> */}
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
         {/* <div className={styles.modalButtons}>
           <button
            className={styles.modalButtonApply}
            onClick={handleReset}
          >
            {i18n.settings.apply}
          </button>
          <button className={styles.modalButtonCancel} onClick={toggleModal}>
            {i18n.settings.cancel}
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ModalSyncSub;
