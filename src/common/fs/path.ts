export type ItemIdentifier = FileItemIdentifier | FolderItemIdentifier;

const illegalIdentifierPattern = /[\/\\"<>|:*?\x00-\x1f\x7f-\x9f]/;

export class FileItemIdentifier {
    name: string;
    extension: string;

    public constructor(
        name: string,
        extension: string,
    ) {
        if (name.length === 0 && extension.length === 0) {
            throw new ItemPathError(ItemPathErrorKind.EmptyIdentifier);
        }

        const validationTarget = name + extension;

        if (validationTarget.match(illegalIdentifierPattern) !== null) {
            throw new ItemPathError(ItemPathErrorKind.IncludesIllegalCharacter);
        }

        this.name = name;
        this.extension = extension;
    }

    public static from(id: string): FileItemIdentifier {
        const noWhitespaceId = id.replace(/\s/g, '');

        if (noWhitespaceId.match(/^[.]*$/) !== null) {
            throw new ItemPathError(ItemPathErrorKind.EmptyIdentifier);
        }

        const trimmedId = id.replace(/^\s+|\s+$/g, '');
        const tokens = trimmedId.split('.');

        // without extension
        if (tokens.length === 1) {
            return new FileItemIdentifier(tokens[0], '');
        }

        const extension = tokens[tokens.length - 1];
        // Justify the end index not to skip a last dot.
        const nameEnd = trimmedId.length - extension.length - (trimmedId.endsWith('.') ? 0 : 1);
        const name = trimmedId.substring(0, nameEnd);
        return new FileItemIdentifier(name, extension);
    }

    public toString(): string {
        const dot = this.extension.length === 0 ? '' : '.';
        return this.name + dot + this.extension;
    }
};

// todo: Add EmptyIdentifier error.
export type FolderItemIdentifier = string; 

export enum ItemPathErrorKind {
    EmptyIdentifier = 'Empty string specified as item identifier.',
    CannotAppendToFilePath = 'Cannot append to file path.',
    HierarchyCountIsOutOfBounds = 'Hierarchy count is out of bounds.',
    IncludesIllegalCharacter = 'Item identifier includes illegal character.',
}

export class ItemPathError extends Error {
    public path?: ItemPath;

    public constructor(kind: ItemPathErrorKind, path?: ItemPath) {
        super();
        this.name = '';
        this.message = kind;
        this.path = path;
    }
}

export type DriveLetter = string | undefined;
export const duplicateItemSuffix = '_copy';

export class ItemPath {
    private driveLetter: DriveLetter;
    private hierarchy: string[];
    private _isFolder: boolean;

    public constructor(
        driveLetter: DriveLetter,
        hierarchy: string[],
        isFolder: boolean,
    ) {
        this.driveLetter = driveLetter;
        this.hierarchy = hierarchy;
        this._isFolder = isFolder;
    }

    public isEqual(path: ItemPath): boolean {
        return this.getFullPath() === path.getFullPath();
    }

    public isRoot(): boolean {
        return this.hierarchy.length === 0;
    }

    public isFolder(): boolean {
        return this._isFolder;
    }

    // todo: add tests
    public static from(path: string, isFolder: boolean): ItemPath {
        const matches = path.match(/^(?<driveLetter>[a-zA-Z]):(?<hierarchy>.*)/);
        const primitiveHierarchy = matches !== null ? matches.groups!['hierarchy'] : path;
        const hierarchy = primitiveHierarchy.split(/[\/\\]/g).filter((v) => v.length !== 0);
        const driveLetter = matches !== null ? matches.groups!['driveLetter'].toUpperCase() : undefined;
        return new ItemPath(driveLetter, hierarchy, isFolder);
    }

    public append(
        id: ItemIdentifier,
        isFolder: boolean,
    ): ItemPath {
        if (!this._isFolder) {
            throw new ItemPathError(ItemPathErrorKind.CannotAppendToFilePath, this);
        }

        // test: toString()
        const path = this.hierarchy.concat(id.toString());
        return new ItemPath(this.driveLetter, path, isFolder);
    }

    public getDriveLetter(): DriveLetter {
        return this.driveLetter;
    }

    public getHierarchy(): string[] {
        return this.hierarchy;
    }

    // todo: add to tests
    public getParent(count: number = 1): ItemPath {
        if (count < 0 || count > this.hierarchy.length) {
            throw new ItemPathError(ItemPathErrorKind.HierarchyCountIsOutOfBounds, this);
        }

        const newHierarchy = this.hierarchy.concat().splice(0, this.hierarchy.length - count);
        return new ItemPath(this.driveLetter, newHierarchy, true);
    }

    public getFullPath(): string {
        const prefix = this.driveLetter !== undefined ? this.driveLetter + ':' : '';
        const dirSuffix = this._isFolder && this.hierarchy.length !== 0 ? '/' : '';
        return `${prefix}/${this.hierarchy.join('/')}${dirSuffix}`;
    }

    public getIdentifier(): ItemIdentifier {
        const id = this.hierarchy.at(this.hierarchy.length - 1) ?? '/';
        return this._isFolder ? id as FolderItemIdentifier : FileItemIdentifier.from(id);
    }

    public duplicate(): ItemPath {
        let id = this.getIdentifier();

        if (!this.isFolder()) {
            const fileId = id as FileItemIdentifier;
            id = FileItemIdentifier.from(fileId.name + duplicateItemSuffix + '.' + fileId.extension);
        } else {
            (id as string) += duplicateItemSuffix;
        }

        const newPath = new ItemPath(this.getDriveLetter(), this.getHierarchy().concat(), this.isFolder());
        return newPath.getParent().append(id, this.isFolder());
    }
}
