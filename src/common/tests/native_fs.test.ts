import { NativeFs } from '../fs';
import { ItemKind } from '../item';

function getNativeFullPath(path: string): string {
    return `${__dirname}/fs/${path}`;
}

const fs = new NativeFs();

test('getChildren', async () => {
        const children = await fs.getChildren(getNativeFullPath(''))
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
            id: item.getItem().id.toString(),
            kind: item.getItem().kind,
        }));

        expect(target).toEqual(childrenToBe);
    }
);
