const RESPONSE_SIZE_BYTES = 4;

/**
 * Reads array of bytes from a given `ptr` that has to have `len` bytes size.
 *
 */
export function readRequestBytes(ptr: i32, size: i32): Uint8Array {
  let bb: Uint8Array = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    bb[i] = load<u8>(ptr + i)
  }

  __free(changetype<usize>(ptr));

  return bb;
}

/**
 * Reads string from a given `ptr` that has to have `len` bytes size.
 *
 */
export function readRequestString(ptr: i32, size: i32): string {
  let bb = readRequestBytes(ptr, size);
  let request = String.UTF8.decode(bb.buffer);
  __free(changetype<usize>(bb));
  return request
}

/**
 * Allocates 'RESPONSE_SIZE_BYTES + response.len()' bytes and writes length of the response as little
 * endianes RESPONSE_SIZE_BYTES bytes and then writes content of 'response'. So the final layout of
 * the response in memory is following:
 *
 *  | array_length: RESPONSE_SIZE_BYTES bytes (little-endian) | array: $array_length bytes |
 *
 * This function should normally be used for returning response of `invoke` function. Vm wrapper
 * expects response in this format.
 *
 * @return response pointer
 */
export function writeResponseBytes(response: Uint8Array): i32 {
  let len: i32 = response.length;
  let addr = __alloc(len + RESPONSE_SIZE_BYTES, 1);
  for (let i = 0; i < RESPONSE_SIZE_BYTES; i++) {
    let b: u8 = (len >> i * 8) as u8 & 0xFF;
    store<u8>(addr + i, b);
  }

  let responseAddr = addr + RESPONSE_SIZE_BYTES;
  for (let i = 0; i < len; i++) {
    let b: u8 = response[i];
    store<u8>(responseAddr + i, b);
  }

  __free(changetype<usize>(response.buffer));
  __free(changetype<usize>(response));
  return addr;
}

/**
 * Converts response to bytes and put it to the memory.
 * @see `writeResponseBytes`
 * @param response
 */
export function writeResponseString(response: string): i32 {
  let strLen: i32 = response.length;
  let addr = __alloc(strLen + RESPONSE_SIZE_BYTES, 1);
  for (let i = 0; i < RESPONSE_SIZE_BYTES; i++) {
    let b: u8 = (strLen >> i * 8) as u8 & 0xFF;
    store<u8>(addr + i, b);
  }

  let strAddr = addr + RESPONSE_SIZE_BYTES;
  for (let i = 0; i < strLen; i++) {
    let b: u8 = response.charCodeAt(i) as u8;
    store<u8>(strAddr + i, b);
  }

  return addr;
}

/**
 * Reads request as a string, handles a request and returns pointer on a response.
 *
 */
export function stringHandler(ptr: i32, size: i32, handler: (request: string) => string): i32 {

  let strRequest = readRequestString(ptr, size);

  let response = handler(strRequest);

  let responseAddr = writeResponseString(response);
  __free(ptr);
  __free(changetype<usize>(strRequest));
  __free(changetype<usize>(response));

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

  let response = handler(strRequest);

  let responseAddr = writeResponseString(response);
  __free(ptr);
  __free(changetype<usize>(strRequest));

  log("Response: " + response);

  __free(changetype<usize>(response));

  return responseAddr;
}

/**
 * Reads request as bytes, handles a request and returns pointer on a response.
 *
 */
export function bytesHandler(ptr: i32, size: i32, handler: (request: Uint8Array) => Uint8Array): i32 {

  let bytesRequest = readRequestBytes(ptr, size);

  let response = handler(bytesRequest);

  let responseAddr = writeResponseBytes(response);
  __free(ptr);
  __free(changetype<usize>(bytesRequest));

  return responseAddr;
}
