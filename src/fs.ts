const fs = window.require('fs').promises;

namespace Fs {
    export const encoding = 'utf-8';

    export function readFile(path: string): Promise<string> {
        return fs.readFile(path, {
            encoding: encoding,
        });
    }
}

export default Fs;
