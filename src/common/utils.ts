import UUIDClass from "uuidjs";

export type UuidString = string;

export function generateUuid(): UuidString {
    return UUIDClass.genV4().hexString;
}

export enum Platform {
    Win32,
    Darwin,
    Linux,
    Unknown,
}

let fakePlatform: Platform | null = null;

export function fakePlatformInContext(platform: Platform, callback: () => void) {
    fakePlatform = platform;
    callback();
    fakePlatform = null;
}

export function getPlatform(): Platform {
    return Platform.Darwin;
}
