import { NativeFs } from '../fs';
import { ItemKind, ItemPath } from '../item';

function getNativeFullPath(path: string): string {
    return `${__dirname}/fs/${path}`;
}

const fs = new NativeFs();

test('native fs: get directory children', async () => {
    const children = await fs.getChildren(new ItemPath([getNativeFullPath('')], '', true));

    const childrenToBe: {
        id: string,
        kind: ItemKind,
    }[] = [
        {
            id: 'desktop.ini',
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
