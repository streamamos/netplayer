import React, { useState } from 'react';
import { useSubtitleSettings, useVideoProps } from '../../../../contexts';
import NestedMenu from '../../../NestedMenu';
import ModalSyncSub from './ModalSyncSub';

const SubtitleSyncSub = (props: any) => {
  const { delayTime } = useSubtitleSettings();
  const [isShowModal, setIsShowModal] = useState(false);
  const { i18n } = useVideoProps();
  const handleToggleModal = () => {
    setIsShowModal((prevState) => !prevState);
  };
  return (
    <>
      <NestedMenu.CustomItem
        {...props}
        itemKey="subtitle_async"
        title={i18n.settings.subtitleSync}
        onChange={() => {}}
        value={i18n.settings.subtitleSync}
        activeItemKey={delayTime.toString() + 'ms'}
        onClick={handleToggleModal}
      />
      {isShowModal && <ModalSyncSub toggleModal={handleToggleModal} />}
    </>
  );
};

export default SubtitleSyncSub;
