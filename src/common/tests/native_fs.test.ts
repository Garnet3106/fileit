import Fs, { FsErrorKind, NativeFs } from '../fs/fs';
import { ItemKind } from '../fs/item';
import { FileItemIdentifier, ItemIdentifier, ItemPath } from '../fs/path';

function getNativeItemPath(hierarchy: string[], isFolder: boolean): ItemPath {
    return ItemPath.from(`${__dirname}/fs/${hierarchy.join('/')}`, isFolder);
}

const nativeFs = new NativeFs();

describe('NativeFs.exists()', () => {
    test('existing file', async () => {
        expect(await nativeFs.exists(getNativeItemPath(['existence', 'a'], true))).toEqual(true);
    });

    test('existing directory', async () => {
        expect(await nativeFs.exists(getNativeItemPath(['existence', 'a.txt'], false))).toEqual(true);
    });

    test('not existing file', async () => {
        expect(await nativeFs.exists(getNativeItemPath(['existence', 'b'], true))).toEqual(false);
    });

    test('not existing directory', async () => {
        expect(await nativeFs.exists(getNativeItemPath(['existence', 'b.txt'], false))).toEqual(false);
    });
});

describe('NativeFs.getStats()', () => {
    test('file stats', async () => {
        expect(await nativeFs.getStats(getNativeItemPath(['stats', 'a.txt'], false))).toEqual({
            kind: ItemKind.File,
            size: 16,
            created: expect.any(Date),
            lastAccessed: expect.any(Date),
            lastModified: expect.any(Date),
        });
    });

    test('get folder stats', async () => {
        expect(await nativeFs.getStats(getNativeItemPath(['stats', 'a'], false))).toEqual({
            kind: ItemKind.Folder,
            size: undefined,
            created: expect.any(Date),
            lastAccessed: expect.any(Date),
            lastModified: expect.any(Date),
        });
    });

    test('not exists', async () => {
        await expect(nativeFs.getStats(getNativeItemPath(['notexists'], true))).rejects
            .toThrowError(FsErrorKind.NotExists);
    });
});

describe('NativeFs.getChildren()', () => {
    test('directory children', async () => {
        const children = await nativeFs.getChildren(getNativeItemPath(['children'], true));

        const sort = (a: string, b: string) => {
            if (a === b) {
                return 0;
            } else {
                return a < b ? -1 : 1;
            }
        };

        const childrenToBe: {
            kind: ItemKind,
            id: ItemIdentifier,
        }[] = [
            {
                kind: ItemKind.Folder,
                id: 'a',
            },
            {
                kind: ItemKind.Folder,
                id: 'b',
            },
            {
                kind: ItemKind.File,
                id: FileItemIdentifier.from('a.txt'),
            },
            {
                kind: ItemKind.File,
                id: FileItemIdentifier.from('b.txt'),
            },
        ].sort((a, b) => sort(a.id.toString(), b.id.toString()));

        const target = Object.entries(children)
            .map(([_index, item]) => ({
                id: item.getIdentifier(),
                kind: item.getItem().kind,
            }))
            .sort((a, b) => sort(a.id.toString(), b.id.toString()));

        expect(target).toEqual(childrenToBe);
    });

    test('not exists', async () => {
        await expect(nativeFs.getChildren(getNativeItemPath(['notexists'], true))).rejects
            .toThrowError(FsErrorKind.NotExists);
    });
});

describe('Fs.duplicatePath()', () => {
    test('duplicate file path', async () => {
        const path = getNativeItemPath(['duplicate', 'a.txt'], false);
        const expected = path.getParent().append(FileItemIdentifier.from('exists_copy_copy.txt'), false).getFullPath();
        expect(Fs.getDuplicatePath(path).getFullPath()).toEqual(expected);
    });
});

// describe('NativeFs.duplicate()', () => {
//     test('duplicate file', async () => {
//         const path = getNativeItemPath(['duplicate', 'a.txt'], false);
//         await nativeFs.duplicate(path);
//         expect(nativeFs.exists(path)).toEqual(true);
//         await remove
//     });

//     test('not exists', async () => {
//         await expect(nativeFs.duplicate(getNativeItemPath(['notexists'], true))).rejects
//             .toThrowError(FsErrorKind.NotExists);
//     });
// });
