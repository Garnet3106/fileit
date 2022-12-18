import UUIDClass from "uuidjs";
import { ItemPath } from "./fs/path";

export type UuidString = string;

export function generateUuid(): UuidString {
    return UUIDClass.genV4().hexString;
}

export enum Platform {
    Win32,
    Darwin,
    Linux,
    Other,
}

export class Lazy<T> {
    private value: T | null = null;
    private handlers: ((value: T) => void)[] = [];

    public get(callback: (value: T) => void) {
        if (this.value === null) {
            this.handlers.push(callback);
        } else {
            callback(this.value);
        }
    }

    public set(newValue: T) {
        this.value = newValue;
        this.handlers.forEach((eachHandler) => eachHandler(newValue));
        this.handlers = [];
    }
}

export const platform = new Lazy<Platform>();
export const homeDirectoryPath = new Lazy<ItemPath>();
