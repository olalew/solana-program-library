import { PublicKey } from '@solana/web3.js';
import { getArrayCodec, getBytesCodec, getStructCodec, getTupleCodec } from '@solana/codecs-data-structures';
import { getStringCodec } from '@solana/codecs-strings';

export const TOKEN_METADATA_DISCRIMINATOR = Buffer.from([112, 132, 90, 90, 11, 88, 157, 87]);

const tokenMetadataCodec = getStructCodec([
    ['updateAuthority', getBytesCodec({ size: 32 })],
    ['mint', getBytesCodec({ size: 32 })],
    ['name', getStringCodec()],
    ['symbol', getStringCodec()],
    ['uri', getStringCodec()],
    ['additionalMetadata', getArrayCodec(getTupleCodec([getStringCodec(), getStringCodec()]))],
]);

export interface TokenMetadata {
    // The authority that can sign to update the metadata
    updateAuthority?: PublicKey;
    // The associated mint, used to counter spoofing to be sure that metadata belongs to a particular mint
    mint: PublicKey;
    // The longer name of the token
    name: string;
    // The shortened symbol for the token
    symbol: string;
    // The URI pointing to richer metadata
    uri: string;
    // Any additional metadata about the token as key-value pairs
    additionalMetadata: [string, string][];
}

// Checks if all elements in the array are 0
function isNonePubkey(buffer: Uint8Array): boolean {
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) {
            return false;
        }
    }
    return true;
}

// Pack TokenMetadata into byte slab
export function pack(meta: TokenMetadata): Uint8Array {
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = meta.updateAuthority ?? PublicKey.default;
    return tokenMetadataCodec.encode({
        ...meta,
        updateAuthority: updateAuthority.toBuffer(),
        mint: meta.mint.toBuffer(),
    });
}

// unpack byte slab into TokenMetadata
export function unpack(buffer: Buffer | Uint8Array): TokenMetadata {
    const data = tokenMetadataCodec.decode(buffer);

    return isNonePubkey(data.updateAuthority)
        ? {
              mint: new PublicKey(data.mint),
              name: data.name,
              symbol: data.symbol,
              uri: data.uri,
              additionalMetadata: data.additionalMetadata,
          }
        : {
              updateAuthority: new PublicKey(data.updateAuthority),
              mint: new PublicKey(data.mint),
              name: data.name,
              symbol: data.symbol,
              uri: data.uri,
              additionalMetadata: data.additionalMetadata,
          };
}
