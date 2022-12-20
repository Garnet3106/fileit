import { Platform } from "../utils";

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

export const filePatterns = {
    identifier: {
        illegal: /[\/\\"<>|:*?\x00-\x1f\x7f-\x9f]/,
    },
    extensions: {
        compressed: /^(7z|gz|lzh|tgz|zip)$/,
        image: /^(apng|bmp|gif|jfif|jpeg|jpg|png|webp)$/,
    },
};

export class ItemIdentifierValidationResult {
    public readonly errorKind?: ItemPathErrorKind;

    public constructor(errorKind?: ItemPathErrorKind) {
        this.errorKind = errorKind;
    }

    public then(callback: () => void): ItemIdentifierValidationResult {
        if (this.errorKind === undefined) {
            callback();
        }

        return this;
    }

    public catch(callback: (errorKind: ItemPathErrorKind) => void): ItemIdentifierValidationResult {
        if (this.errorKind !== undefined) {
            callback(this.errorKind);
        }

        return this;
    }
}

export interface ItemIdentifier {
    toString: () => string;
}

export class FileItemIdentifier implements ItemIdentifier {
    private name: string;
    private extension: string;

    public constructor(
        name: string,
        extension: string,
    ) {
        if (name.length === 0 && extension.length === 0) {
            throw new ItemPathError(ItemPathErrorKind.EmptyIdentifier);
        }

        this.name = name;
        this.extension = extension;
    }

    public static from(id: string): FileItemIdentifier {
        const validationResult = FileItemIdentifier.validate(id);

        if (validationResult.errorKind !== undefined) {
            throw new ItemPathError(validationResult.errorKind);
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

    public static validate(id: string): ItemIdentifierValidationResult {
        const noWhitespaceId = id.replace(/\s/g, '');

        if (noWhitespaceId.match(/^[.]*$/) !== null) {
            return new ItemIdentifierValidationResult(ItemPathErrorKind.EmptyIdentifier);
        }

        if (id.match(filePatterns.identifier.illegal) !== null) {
            return new ItemIdentifierValidationResult(ItemPathErrorKind.IncludesIllegalCharacter);
        }

        return new ItemIdentifierValidationResult();
    }

    public getName(): string {
        return this.name;
    }

    public getExtension(): string {
        return this.extension;
    }

    public toString(): string {
        const dot = this.extension.length === 0 ? '' : '.';
        return this.name + dot + this.extension;
    }

    public isImage(): boolean {
        return this.getExtension().match(filePatterns.extensions.image) !== null;
    }

    public isCompressed(): boolean {
        return this.getExtension().match(filePatterns.extensions.compressed) !== null;
    }
}

export class FolderItemIdentifier implements ItemIdentifier {
    private id: string;

    public constructor(id: string) {
        this.id = id;
    }

    public toString(): string {
        return this.id;
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

    // todo: add tests
    public static from(path: string, isFolder: boolean): ItemPath {
        const matches = path.match(/^(?<driveLetter>[a-zA-Z]):(?<hierarchy>.*)/);
        const primitiveHierarchy = matches !== null ? matches.groups!['hierarchy'] : path;
        const hierarchy = primitiveHierarchy.split(/[\/\\]/g).filter((v) => v.length !== 0);
        const driveLetter = matches !== null ? matches.groups!['driveLetter'].toUpperCase() : undefined;
        return new ItemPath(driveLetter, hierarchy, isFolder);
    }

    public static getRoot(platform: Platform): ItemPath {
        const driveLetter = platform === Platform.Win32 ? 'C' : undefined;
        return new ItemPath(driveLetter, [], true);
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

    public isExtractable(): boolean {
        return (
            !this.isFolder() &&
            (this.getIdentifier() as FileItemIdentifier).isCompressed()
        );
    }

    public append(
        id: string,
        isFolder: boolean,
    ): ItemPath {
        if (!this._isFolder) {
            throw new ItemPathError(ItemPathErrorKind.CannotAppendToFilePath, this);
        }

        const validationResult = FileItemIdentifier.validate(id);

        if (validationResult.errorKind !== undefined) {
            throw new ItemPathError(validationResult.errorKind);
        }

        const path = this.hierarchy.concat(id);
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
        return this._isFolder ? new FolderItemIdentifier(id) : FileItemIdentifier.from(id);
    }

    public duplicate(): ItemPath {
        let id = this.getIdentifier();

        if (this.isFolder()) {
            id = id.toString() + duplicateItemSuffix;
        } else {
            const fileId = id as FileItemIdentifier;
            id = fileId.getName() + duplicateItemSuffix + '.' + fileId.getExtension();
        }

        const newPath = new ItemPath(this.getDriveLetter(), this.getHierarchy().concat(), this.isFolder());
        return newPath.getParent().append(id.toString(), this.isFolder());
    }
}
