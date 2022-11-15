import { FakeFs } from '../fs';
import { FileItemIdentifier, ItemIdentifier, ItemKind, ItemPath } from '../item';

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
