import { NativeFs } from '../fs';
import { FileItemIdentifier, ItemIdentifier, ItemKind, ItemPath } from '../item';

// fix
// function getNativeItemPath(path: string = ''): ItemPath {
//     const hierarchy = `${__dirname}/fs/${path}`.split(/[\/\\]/g);
// }

const fs = new NativeFs();

test('native fs: get directory children', async () => {
    const children = await fs.getChildren(new ItemPath('C', [
        'Users', 'Garnet3106', 'Desktop', 'Media', 'Docs', 'Repos', 'fileit', 'src', 'common', 'tests', 'fs',
    ], true));

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
