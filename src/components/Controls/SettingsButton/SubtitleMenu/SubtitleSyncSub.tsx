import React from 'react';
import { useSubtitleSettings, useVideoProps } from '../../../../contexts';
import NestedMenu from '../../../NestedMenu';
import ModalSyncSub from './ModalSyncSub';

const SubtitleSyncSub = (props: any) => {
  const { delayTime } = useSubtitleSettings();
  const { i18n } = useVideoProps();
  return (
    <>
      <NestedMenu.CustomItem
        {...props}
        itemKey="subtitle_async"
        title={i18n.settings.subtitleSync}
        onChange={() => {}}
        value={i18n.settings.subtitleSync}
        activeItemKey={delayTime.toString() + 'ms'}
      />
      <ModalSyncSub />
    </>
  );
};

export default SubtitleSyncSub;
