import { FakeFs } from '../fs';
import { ItemKind } from '../item';

const fs = new FakeFs();

test('get directory children', async () => {
        const children = await fs.getChildren('')
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
    }
);
