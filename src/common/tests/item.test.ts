import { FileItemIdentifier } from "../item";

test('generate empty file identifier', () => {
    expect(FileItemIdentifier.from('')).toEqual(new FileItemIdentifier('', ''));
});

test('generate normal file identifier', () => {
    expect(FileItemIdentifier.from('file.txt')).toEqual(new FileItemIdentifier('file', 'txt'));
});

test('generate file identifier without extension', () => {
    expect(FileItemIdentifier.from('file')).toEqual(new FileItemIdentifier('file', ''));
});

test('generate file identifier without name', () => {
    expect(FileItemIdentifier.from('.txt')).toEqual(new FileItemIdentifier('', 'txt'));
});
