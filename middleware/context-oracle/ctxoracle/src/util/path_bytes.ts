// The one place a path's bytes become a string (Step 5 build delta, gap-list
// review G7). POSIX defines a pathname as a byte string; git's `-z` output and a
// `readdir` with `{encoding: 'buffer'}` hand over those bytes. The miner (Step
// 13) and the indexer walk (Step 14) both decode every path here and exclude a
// path this module rejects (counting it for the `path_not_utf8` fault), so the
// two writers of `files` can never key one byte string two ways. The WHATWG
// Encoding Standard's `fatal` flag is the documented way to refuse an invalid
// sequence rather than substitute U+FFFD (the executed defect: `bad\xff.txt`
// and `bad\xfe.txt` collapsed into one `bad\ufffd.txt` row).

const NUL = 0x00;
// `ignoreBOM: true` keeps a leading EF BB BF in the result: the default strips
// it, which would key the byte strings `\xef\xbb\xbfa` and `a` as one path.
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/** Fields between NULs; a trailing empty field is dropped. */
export function splitNul(buf: Buffer): Buffer[] {
  const fields: Buffer[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === NUL) {
      fields.push(buf.subarray(start, i));
      start = i + 1;
    }
  }
  if (start < buf.length) fields.push(buf.subarray(start));
  return fields;
}

/** Fatal UTF-8 decode (`TextDecoder('utf-8', {fatal: true})`); null on an invalid sequence. */
export function decodePathBytes(bytes: Buffer): string | null {
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

/** Printable ASCII 0x20–0x7e except `\` kept; every other byte as `\xHH` (fault detail only). */
export function escapeBytes(bytes: Buffer): string {
  let out = '';
  for (const b of bytes) {
    if (b >= 0x20 && b <= 0x7e && b !== 0x5c) out += String.fromCharCode(b);
    else out += `\\x${b.toString(16).padStart(2, '0')}`;
  }
  return out;
}
