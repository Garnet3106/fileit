import FakeFs from "./fake_fs";

namespace Fs {
    export enum ErrorKind {
        NoSuchFileOrDirectory = 'no such file or directory',
        NotADirectory = 'not a directory',
        NotAFile = 'not a file',
    }

    export const encoding = 'utf-8';

    function getFsPromises(onProdEnv: (fs: any) => any, onDevEnv: (fs: any) => any): any {
        if (process.env.NODE_ENV === 'production') {
            return onProdEnv(window.require('fs').promises);
        } else {
            return onDevEnv(FakeFs);
        }
    }

    export function getChildren(path: string): Promise<string> {
        return getFsPromises(
            (fs) => fs.readdir(path, {
                encoding: encoding,
            }),
            (fs) => fs.getChildren(path),
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
