import type { BlockType } from "../types";

export interface ClipboardFile {
  file: File;
  type: BlockType;
}

export const getFilesFromClipboard = (e: React.ClipboardEvent): ClipboardFile[] => {
  const items = e.clipboardData.items;
  const foundFiles: ClipboardFile[] = [];

  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      const file = items[i].getAsFile();
      if (!file) continue;

      let blockType: BlockType = 'file';
      if (file.type.startsWith('image/')) blockType = 'image';
      else if (file.type.startsWith('video/')) blockType = 'video';

      foundFiles.push({ file, type: blockType });
    }
  }
  return foundFiles;
};