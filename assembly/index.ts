/**
 * Read bytes from memory.
 * @param ptr
 * @param size
 */
export function readRequestBytes(ptr: usize, size: usize): Uint8Array {
  let bb: Uint8Array = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    bb[i] = load<u8>(ptr + i)
  }

  return bb;
}

export function readRequestString(ptr: usize, size: usize): string {
  let bb = readRequestBytes(ptr, size);
  return String.fromUTF8(bb.buffer.data, bb.length);
}

export function writeResponseBytes(bb: Uint8Array): usize {
  let len: usize = bb.length;
  let addr = memory.allocate(len + 4);
  for (let i = 0; i < 4; i++) {
    let b: u8 = (len >> i * 8) as u8 & 0xFF;
    store<u8>(addr + i, b);
  }

  let responseAddr = addr + 4;
  for (let i = 0; i < len; i++) {
    let b: u8 = bb[i];
    store<u8>(responseAddr + i, b);
  }

  memory.free(changetype<usize>(bb.buffer));
  memory.free(changetype<usize>(bb));
  return addr;
}

export function writeResponseString(response: string): usize {
  let strLen: usize = response.length;
  let addr = memory.allocate(strLen + 4);
  for (let i = 0; i < 4; i++) {
    let b: u8 = (strLen >> i * 8) as u8 & 0xFF;
    store<u8>(addr + i, b);
  }

  let strAddr = addr + 4;
  for (let i = 0; i < strLen; i++) {
    let b: u8 = response.charCodeAt(i) as u8;
    store<u8>(strAddr + i, b);
  }

  memory.free(changetype<usize>(response));
  return addr;
}

export function stringHandler(ptr: usize, size: usize, handler: (request: string) => string): usize {

  let strRequest = readRequestString(ptr, size);

  let result = handler(strRequest);

  let responseAddr = writeResponseString(result);
  memory.free(ptr);
  memory.free(changetype<usize>(strRequest));

  return responseAddr;
}

export function bytesHandler(ptr: usize, size: usize, handler: (request: Uint8Array) => Uint8Array): usize {

  let bytesRequest = readRequestBytes(ptr, size);

  let result = handler(bytesRequest);

  let responseAddr = writeResponseBytes(result);
  memory.free(ptr);
  memory.free(changetype<usize>(bytesRequest));

  return responseAddr;
}
