// Converte WOFF (v1) em TTF/OTF para o opentype.js ler.
const zlib = require('zlib');
function woffToSfnt(buf) {
  const numTables = buf.readUInt16BE(12);
  const flavor = buf.readUInt32BE(4);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = buf.toString('ascii', o, o + 4);
    const off = buf.readUInt32BE(o + 4), comp = buf.readUInt32BE(o + 8), orig = buf.readUInt32BE(o + 12), csum = buf.readUInt32BE(o + 16);
    let data = buf.subarray(off, off + comp);
    if (comp < orig) data = zlib.inflateSync(data);
    tables.push({ tag, csum, data });
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const pow2 = 1 << Math.floor(Math.log2(numTables));
  const searchRange = pow2 * 16, entrySelector = Math.log2(pow2), rangeShift = numTables * 16 - searchRange;
  const head = Buffer.alloc(12 + numTables * 16);
  head.writeUInt32BE(flavor, 0); head.writeUInt16BE(numTables, 4); head.writeUInt16BE(searchRange, 6);
  head.writeUInt16BE(entrySelector, 8); head.writeUInt16BE(rangeShift, 10);
  let off = head.length; const parts = [head];
  tables.forEach((t, i) => {
    const e = 12 + i * 16;
    head.write(t.tag, e, 'ascii'); head.writeUInt32BE(t.csum, e + 4); head.writeUInt32BE(off, e + 8); head.writeUInt32BE(t.data.length, e + 12);
    const pad = (4 - (t.data.length % 4)) % 4;
    parts.push(t.data, Buffer.alloc(pad)); off += t.data.length + pad;
  });
  return Buffer.concat(parts);
}
module.exports = { woffToSfnt };
