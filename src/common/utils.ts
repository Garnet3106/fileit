import UUIDClass from "uuidjs";

export type UuidString = string;

export function generateUuid(): UuidString {
    return UUIDClass.genV4().hexString;
}
