/**
 * Reads array of bytes from a given `ptr` that has to have `len` bytes size.
 *
 */
export function readRequestBytes(ptr: i32, size: i32): Uint8Array {
  let bb: Uint8Array = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    bb[i] = load<u8>(ptr + i)
  }

  return bb;
}

/**
 * Reads string from a given `ptr` that has to have `len` bytes size.
 *
 */
export function readRequestString(ptr: i32, size: i32): string {
  let bb = readRequestBytes(ptr, size);
  return String.fromUTF8(bb.buffer.data, bb.length);
}

/**
 * Allocates 'RESPONSE_SIZE_BYTES + response.len()' bytes and writes length of the result as little
 * endianes RESPONSE_SIZE_BYTES bytes and then writes content of 'result'. So the final layout of
 * the result in memory is following:
 *
 *  | array_length: RESPONSE_SIZE_BYTES bytes (little-endian) | array: $array_length bytes |
 *
 * This function should normally be used for returning result of `invoke` function. Vm wrapper
 * expects result in this format.
 *
 * @return response pointer
 */
export function writeResponseBytes(bb: Uint8Array): i32 {
  let len: i32 = bb.length;
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

/**
 * Converts response to bytes and put it to the memory.
 * @see `writeResponseBytes`
 * @param response
 */
export function writeResponseString(response: string): i32 {
  let strLen: i32 = response.length;
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

/**
 * Reads request as a string, handles a request and returns pointer on a response.
 *
 */
export function stringHandler(ptr: i32, size: i32, handler: (request: string) => string): i32 {

  let strRequest = readRequestString(ptr, size);

  let result = handler(strRequest);

  let responseAddr = writeResponseString(result);
  memory.free(ptr);
  memory.free(changetype<usize>(strRequest));

  return responseAddr;
}

/**
 * Reads request as a string, handles a request and returns pointer on a response.
 * Logs request and response.
 *
 */
export function loggedStringHandler(ptr: i32, size: i32, handler: (request: string) => string, log: (msg: string) => void): i32 {
  let strRequest = readRequestString(ptr, size);
  log("Request: " + strRequest);

  let result = handler(strRequest);

  let responseAddr = writeResponseString(result);
  memory.free(ptr);
  memory.free(changetype<usize>(strRequest));

  log("Response: " + result);

  return responseAddr;
}

/**
 * Reads request as bytes, handles a request and returns pointer on a response.
 *
 */
export function bytesHandler(ptr: i32, size: i32, handler: (request: Uint8Array) => Uint8Array): i32 {

  let bytesRequest = readRequestBytes(ptr, size);

  let result = handler(bytesRequest);

  let responseAddr = writeResponseBytes(result);
  memory.free(ptr);
  memory.free(changetype<usize>(bytesRequest));

  return responseAddr;
}
