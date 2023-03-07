import React, { useState } from 'react';
import { useSubtitleSettings } from '../../../../contexts';
import NestedMenu from '../../../NestedMenu';
import ModalSyncSub from './ModalSyncSub';

const SubtitleSyncSub = (props: any) => {
  const { delayTime } = useSubtitleSettings();
  const [isShowModal, setIsShowModal] = useState(false);
  const handleToggleModal = () => {
    setIsShowModal((prevState) => !prevState);
  };
  return (
    <>
      <NestedMenu.CustomItem
        {...props}
        itemKey="subtitle_async"
        title="Sync Sub"
        onChange={() => {}}
        value="Sync Sub"
        activeItemKey={delayTime.toString() + 'ms'}
        onClick={handleToggleModal}
      />
      {isShowModal && <ModalSyncSub toggleModal={handleToggleModal} />}
    </>
  );
};

export default SubtitleSyncSub;
