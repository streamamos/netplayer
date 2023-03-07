import React, { ChangeEvent, useState } from 'react';
import { useVideoState } from '../../../../contexts';
import NestedMenu from '../../../NestedMenu';
import styles from './index.module.css';

const SubtitleUpload = (props: any) => {
  const { state, setState } = useVideoState();
  const [lengthMySubs, setLengthMySubs] = useState(0);
  const handleUploadSubtitle = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;
      const foundIndexLastDot = uploadedFile.name.lastIndexOf('.') || '';
      const typeOfFile = foundIndexLastDot
        ? uploadedFile.name.substring(foundIndexLastDot + 1)
        : 'vtt';
      if (!['vtt', 'srt'].includes(typeOfFile)) return;
      const textString = (await uploadedFile.text()) || '';
      const blobVTT = new Blob([textString], {
        type: `text/${typeOfFile};charset=ISO-8859-1`,
      });
      const path = URL.createObjectURL(blobVTT) + `#.${typeOfFile}`;
      state.subtitles.forEach((sub) => {
        if (sub.language.includes('My Subtitle')) {
          setLengthMySubs((prev) => prev + 1);
        }
      });
      setState(() => ({
        subtitles: [
          {
            file: path,
            lang: `My Subtitle ${lengthMySubs + 1}`,
            language: `My Subtitle ${lengthMySubs + 1}`,
          },
          ...state.subtitles,
        ],
        currentSubtitle: `My Subtitle ${lengthMySubs + 1}`,
      }));
    } catch (error) {
      console.log('error: ', error);
    }
  };
  return (
    <NestedMenu.CustomItem
      {...props}
      itemKey="subtitle_upload"
      title="Upload Subtitle"
      onChange={() => {}}
      value="Upload Subtitle"
      activeItemKey={lengthMySubs + ' Subs'}
    >
      <input
        type="file"
        accept=".vtt,.srt"
        className={styles.subtitleUploadInput}
        onChange={handleUploadSubtitle}
      />
    </NestedMenu.CustomItem>
  );
};

export default SubtitleUpload;
