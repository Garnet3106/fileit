import { ItemPath } from "./fs/path";

export enum TabIcon {
    Folder = 'folder',
    CompressedFolder = 'compressed_folder',
}

export type Tab = {
    id: string,
    path: ItemPath,
};
