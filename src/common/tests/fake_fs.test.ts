import { FakeFs } from '../fs';
import { ItemKind, ItemPath } from '../item';

const fs = new FakeFs();

test('fake fs: get directory children', async () => {
    const children = await fs.getChildren(new ItemPath([], '', true));

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
