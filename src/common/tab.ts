export enum TabIcon {
    Folder = 'folder',
    CompressedFolder = 'compressed_folder',
}

export type Tab = {
    id: string,
    icon: TabIcon,
    title: string,
};
