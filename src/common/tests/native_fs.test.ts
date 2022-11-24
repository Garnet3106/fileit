import { NativeFs } from '../fs/fs';
import { ItemKind } from '../fs/item';
import { FileItemIdentifier, ItemIdentifier, ItemPath } from '../fs/path';

function getNativeItemPath(path: string, isFolder: boolean): ItemPath {
    return ItemPath.from(`${__dirname}/fs/${path}`, isFolder);
}

const fs = new NativeFs();

test('native fs: get directory children', async () => {
    const children = await fs.getChildren(getNativeItemPath('', true));

    const childrenToBe: {
        id: ItemIdentifier,
        kind: ItemKind,
    }[] = [
        {
            id: FileItemIdentifier.from('desktop.ini'),
            kind: ItemKind.File,
        },
        {
            id: 'usr',
            kind: ItemKind.Folder,
        },
    ];

    const target = Object.entries(children).map(([_index, item]) => ({
        id: item.getIdentifier(),
        kind: item.getItem().kind,
    }));

    expect(target).toEqual(childrenToBe);
});
