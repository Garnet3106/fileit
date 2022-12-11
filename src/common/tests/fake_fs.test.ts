import { FakeFs } from '../fs/fs';
import { ItemKind } from '../fs/item';
import { FileItemIdentifier, FolderItemIdentifier, ItemIdentifier, ItemPath } from '../fs/path';

const fs = new FakeFs();

test('fake fs: get directory children', async () => {
    const children = await fs.getChildren(new ItemPath(undefined, [], true));

    const childrenToBe: {
        id: ItemIdentifier,
        kind: ItemKind,
    }[] = [
        {
            id: FileItemIdentifier.from('desktop.ini'),
            kind: ItemKind.File,
        },
        {
            id: new FolderItemIdentifier('usr'),
            kind: ItemKind.Folder,
        },
    ];

    const target = Object.entries(children).map(([_index, item]) => ({
        id: item.getIdentifier(),
        kind: item.getItem().kind,
    }));

    expect(target).toEqual(childrenToBe);
});
