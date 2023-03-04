import React, { useRef, useState } from 'react';
import { useSubtitleSettings } from '../../../../contexts';
import useClickOutside from '../../../../hooks/useClickOutside';
import ArrowLeftIcon from '../../../icons/ArrowLeftIcon';
import ArrowRightIcon from '../../../icons/ArrowRightIcon';
import IconPlus from '../../../icons/IconPlus';
import MinusIcon from '../../../icons/MinusIcon';
import styles from './index.module.css';

const ModalSyncSub = ({ toggleModal }: any) => {
  const { delayTime: delayTimeSetting, setDelayTime: setDelayTimeSetting } =
    useSubtitleSettings();
  const modalRef = useRef<HTMLDivElement>(null);
  const [delayTime, setDelayTime] = useState<string | number>(delayTimeSetting);
  const handleApplyDelay = () => {
    setDelayTimeSetting(Number(delayTime));
    toggleModal();
  };
  useClickOutside(modalRef, toggleModal);
  return (
    <div className={styles.modal}>
      <div className={styles.modalOverlay}></div>
      <div className={styles.modalContainer} ref={modalRef}>
        <h2 className={styles.modalHeading}>Subtitle delay</h2>
        <span className={styles.modalTitle}>
          {Number(delayTime) === 0
            ? 'No subtitle delay'
            : Number(delayTime) > 0
            ? `Use this if subtitles are shown ${Math.abs(
                Number(delayTime)
              )} ms too early`
            : `Use this if subtitles are shown ${Math.abs(
                Number(delayTime)
              )} ms too late`}
        </span>
        <div className={styles.modalControl}>
          <button onClick={() => setDelayTime(Number(delayTime) - 1000)}>
            <ArrowLeftIcon style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
          <button onClick={() => setDelayTime(Number(delayTime) - 100)}>
            <MinusIcon
              style={{ width: '1.6rem', height: '1.6rem', color: 'white' }}
            />
          </button>
          <input
            type="text"
            value={delayTime}
            className={styles.modalInput}
            onChange={(e) => {
              if (
                e.target.value === '-' ||
                delayTime === 0 ||
                delayTime === ''
              ) {
                setDelayTime(e.target.value as any);
              }
              const regex = new RegExp('^[+-]?[0-9]+(?:\\.[0-9]+)?$');
              if (e.target.value === '' || regex.test(e.target.value)) {
                setDelayTime(e.target.value as any);
              }
            }}
          />
          <button onClick={() => setDelayTime(Number(delayTime) + 100)}>
            <IconPlus style={{ width: '1.6rem', height: '1.6rem' }} />
          </button>
          <button onClick={() => setDelayTime(Number(delayTime) + 1000)}>
            <ArrowRightIcon style={{ width: '1.3rem', height: '1.3rem' }} />
          </button>
        </div>
        <div className={styles.modalButtons}>
          <button
            className={styles.modalButtonApply}
            onClick={handleApplyDelay}
          >
            Apply
          </button>
          <button className={styles.modalButtonCancel} onClick={toggleModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSyncSub;
