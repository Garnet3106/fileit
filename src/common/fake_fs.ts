import Fs from "./fs";

namespace FakeFs {
    export enum ItemKind {
        Directory,
        File,
    }

    export type Item = Directory | File;

    export type Directory = {
        kind: ItemKind.Directory,
    };

    export type File = {
        kind: ItemKind.File,
        content: string,
    };

    let items: {
        [index: string]: Item,
    } = {
        '': {
            kind: ItemKind.Directory,
        },
        'C:': {
            kind: ItemKind.Directory,
        },
        'C:/main.ches': {
            kind: ItemKind.File,
            content: 'println("hello")',
        },
    };

    export function readFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const target = items[path];

            if (target === undefined) {
                reject(Fs.ErrorKind.NoSuchFileOrDirectory);
            }

            if (target.kind !== ItemKind.File) {
                reject(Fs.ErrorKind.NotAFile);
            }

            resolve((target as File).content);
        });
    }
}

export default FakeFs;
