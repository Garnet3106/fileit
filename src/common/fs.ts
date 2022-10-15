import FakeFs from "./fake_fs";
import { FileItemIdentifier, Item, ItemStats } from "./item";

namespace Fs {
    export enum ErrorKind {
        NoSuchFileOrDirectory = 'no such file or directory',
        NotADirectory = 'not a directory',
        NotAFile = 'not a file',
    }

    export const encoding = 'utf-8';

    function getFs(onProdEnv: (fs: any) => any, onDevEnv: (fs: any) => any): any {
        if (process.env.NODE_ENV === 'production') {
            return onProdEnv(window.require('fs'));
        } else {
            return onDevEnv(FakeFs);
        }
    }

    function getFsPromises(onProdEnv: (fs: any) => any, onDevEnv: (fs: any) => any): any {
        if (process.env.NODE_ENV === 'production') {
            return onProdEnv(window.require('fs').promises);
        } else {
            return onDevEnv(FakeFs);
        }
    }

    export function getStats(path: string): ItemStats {
        return getFs(
            (fs) => {
                let result = {};

                fs.statSync(path, (e: any, stats: any) => {
                    result = {
                        isFile: stats.isFile(),
                        isFolder: stats.isDirectory(),
                    };
                });

                return result;
            },
            (fs) => fs.getStats(path),
        );
    }

    export function getChildren(path: string): Promise<Item[]> {
        const intoItems = (childNames: string[]): Item[] => {
            return childNames.map((eachName) => {
                const absPath = `${path}${path.length !== 0 ? '/' : ''}${eachName}`;

                if (Fs.getStats(absPath).isFile) {
                    return Item.file({
                        id: new FileItemIdentifier(eachName, ''),
                        size: 1000,
                        lastModified: new Date(),
                    });
                } else {
                    return Item.folder({
                        id: eachName,
                        lastModified: new Date(),
                    });
                }
            });
        };

        return getFsPromises(
            (fs) => new Promise((resolve) => {
                fs.readdir(path, {
                    encoding: encoding,
                })
                    .then((childNames: string[]) => {
                        resolve(intoItems(childNames))
                    });
            }),
            (fs) => new Promise((resolve) => {
                fs.getChildren(path)
                    .then((childNames: string[]) => {
                        resolve(intoItems(childNames))
                    });
            }),
        );
    }

    export function readFile(path: string): Promise<string> {
        return getFsPromises(
            (fs) => fs.readFile(path, {
                encoding: encoding,
            }),
            (fs) => fs.readFile(path),
        );
    }
}

export default Fs;
