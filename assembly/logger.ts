export declare function write(b: i32): void;
export declare function flush(): void;

export function log(message: string): void {
    let messageStr = message + "\n";
    let strLen: i32 = messageStr.length;

    for (let i = 0; i < strLen; i++) {
        let b: u8 = messageStr.charCodeAt(i) as u8;
        write(b);
    }
    flush();
}
