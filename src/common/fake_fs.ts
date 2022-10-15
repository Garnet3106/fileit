import Fs from "./fs";

namespace FakeFs {
    export enum ItemKind {
        Directory,
        File,
    }

    export type Item = Directory | File;

    export type Directory = {
        kind: ItemKind.Directory,
        children: string[],
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
            children: [
                'C:'
            ],
        },
        'C:': {
            kind: ItemKind.Directory,
            children: [
                'main.ches',
                'main.rs',
                'main.js',
            ],
        },
        'C:/main.ches': {
            kind: ItemKind.File,
            content: 'println("hello")',
        },
        'C:/main.rs': {
            kind: ItemKind.File,
            content: 'println!("hello");',
        },
        'C:/main.js': {
            kind: ItemKind.File,
            content: 'console.log(\'hello\');',
        },
    };

    export function getChildren(path: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const target = items[path];

            if (target === undefined) {
                reject(Fs.ErrorKind.NoSuchFileOrDirectory);
            }

            if (target.kind !== ItemKind.Directory) {
                reject(Fs.ErrorKind.NotADirectory);
            }

            resolve((target as Directory).children);
        });
    }

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
