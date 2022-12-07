import { FileItemIdentifier, ItemPath, ItemPathErrorKind } from "../fs/path";

describe('append path', () => {
    test('append directory to root path', () => {
        expect((new ItemPath(undefined, [], true)).append('dir', true).getFullPath()).toEqual('/dir/');
    });

    test('append directory to child path', () => {
        expect((new ItemPath('C', ['parent'], true)).append('dir', true).getFullPath()).toEqual('C:/parent/dir/');
    });

    test('append to file path', () => {
        expect(() => (new ItemPath(undefined, ['file.txt'], false)).append('dir', true).getFullPath()).toThrowError(ItemPathErrorKind.CannotAppendToFilePath);
    });
});

describe('get parent path', () => {
    test('get root parent path', () => {
        expect((new ItemPath(undefined, [], true)).getFullPath()).toEqual('/');
    });

    test('get root parent path with drive letter', () => {
        expect((new ItemPath('C', [], true)).getFullPath()).toEqual('C:/');
    });

    // test('create parent path with formatting', () => {
    //     expect((new ItemPath(['', 'C:/', 'parent1/parent2'], '', true)).getParents()).toEqual(['C', 'parent1', 'parent2']);
    // });
});

describe('get parent path', () => {
    test('get full root path without parent', () => {
        expect((new ItemPath(undefined, [], true)).getFullPath()).toEqual('/');
    });

    test('get full drive path without parent', () => {
        expect((new ItemPath('C', [], true)).getFullPath()).toEqual('C:/');
    });

    test('get full directory path with drive parent', () => {
        expect((new ItemPath('C', ['dir'], true)).getFullPath()).toEqual('C:/dir/');
    });

    test('get full file path without parent', () => {
        expect((new ItemPath(undefined, ['file.txt'], false)).getFullPath()).toEqual('/file.txt');
    });

    test('get full directory path without parent', () => {
        expect((new ItemPath(undefined, ['dir'], true)).getFullPath()).toEqual('/dir/');
    });

    test('get full directory path with parents', () => {
        expect((new ItemPath('C', ['parent1', 'parent2', 'dir'], true)).getFullPath()).toEqual('C:/parent1/parent2/dir/');
    });

    test('get full file path with parents', () => {
        expect((new ItemPath('C', ['parent1', 'parent2', 'file.txt'], false)).getFullPath()).toEqual('C:/parent1/parent2/file.txt');
    });
});

describe('duplicate path', () => {
    test('duplicate file path', () => {
        expect(new ItemPath(undefined, ['a.txt'], false).duplicate().getFullPath()).toEqual('/a_copy.txt');
    });

    test('duplicate directory path', () => {
        expect(new ItemPath(undefined, ['a'], true).duplicate().getFullPath()).toEqual('/a_copy/');
    });
});

describe('generate file identifier', () => {
    test('empty string', () => {
        expect(() => FileItemIdentifier.from('')).toThrowError(ItemPathErrorKind.EmptyIdentifier);
    });

    test('normal', () => {
        expect(FileItemIdentifier.from('file.txt')).toEqual(new FileItemIdentifier('file', 'txt'));
    });

    test('untrimmed normal', () => {
        expect(FileItemIdentifier.from('  file.txt  ')).toEqual(new FileItemIdentifier('file', 'txt'));
    });

    test('single dot', () => {
        expect(() => FileItemIdentifier.from('.')).toThrowError(ItemPathErrorKind.EmptyIdentifier);
    });

    test('double dots with whitespaces', () => {
        expect(() => FileItemIdentifier.from(' . . ')).toThrowError(ItemPathErrorKind.EmptyIdentifier);
    });

    test('dot after name', () => {
        expect(() => FileItemIdentifier.from('file.')).toThrowError(ItemPathErrorKind.EmptyIdentifier);
    });

    test('without extension', () => {
        expect(FileItemIdentifier.from('file')).toEqual(new FileItemIdentifier('file', ''));
    });

    test('without name', () => {
        expect(FileItemIdentifier.from('.txt')).toEqual(new FileItemIdentifier('', 'txt'));
    });
});

describe('convert file identifier to string', () => {
    test('normal', () => {
        expect(new FileItemIdentifier('file', 'txt')).toEqual('file.txt');
    });

    test('only name', () => {
        expect(new FileItemIdentifier('file', '')).toEqual('file');
    });

    test('only extension', () => {
        expect(new FileItemIdentifier('', 'txt')).toEqual('.txt');
    });
});
