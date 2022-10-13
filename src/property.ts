export enum ItemPropertyKind {
    Icon,
    Name,
    Size,
    LastModified,
};

export namespace ItemPropertyKind {
    export function localizeName(kind: ItemPropertyKind): string | undefined {
        switch (kind) {
            case ItemPropertyKind.Icon:
            return undefined;

            case ItemPropertyKind.Name:
            return '名前';

            case ItemPropertyKind.Size:
            return 'サイズ';

            case ItemPropertyKind.LastModified:
            return '最終更新日';
        }
    }
}
