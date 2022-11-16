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
