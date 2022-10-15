namespace Fs {
    export const encoding = 'utf-8';

    export function readFile(path: string): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('unimplemented');
            }, 500);
        });
    }
}

export default Fs;
