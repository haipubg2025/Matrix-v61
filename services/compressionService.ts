import pako from 'pako';

/**
 * Utility for compressing and decompressing data using pako (zlib/gzip)
 */
export const compressionService = {
  /**
   * Compresses an object or string into a base64 string
   */
  compress: (data: any): string => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const uint8Array = new TextEncoder().encode(jsonString);
      const compressed = pako.deflate(uint8Array);
      
      // Convert to base64 for easy storage/transfer as a string
      // Using a more efficient way to convert large Uint8Array to base64
      let binary = '';
      const len = compressed.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error("Compression failed:", error);
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  },

  /**
   * Decompresses a base64 string back to its original object or string
   */
  decompress: <T = any>(compressedBase64: string): T | null => {
    try {
      // Check if it's actually compressed (might be plain JSON if it's an old save)
      if (!compressedBase64 || compressedBase64.startsWith('{') || compressedBase64.startsWith('[')) {
        return JSON.parse(compressedBase64);
      }

      const binaryString = atob(compressedBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decompressed = pako.inflate(bytes);
      const jsonString = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Decompression failed:", error);
      // Fallback: maybe it was already plain JSON
      try {
        return JSON.parse(compressedBase64);
      } catch {
        return null;
      }
    }
  },

  /**
   * Compresses to a Blob (binary) for file exports
   */
  compressToBlob: (data: any): Blob => {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const uint8Array = new TextEncoder().encode(jsonString);
    const compressed = pako.deflate(uint8Array);
    return new Blob([compressed], { type: 'application/octet-stream' });
  },

  /**
   * Decompresses from an ArrayBuffer (binary)
   */
  decompressFromBuffer: <T = any>(buffer: ArrayBuffer): T | null => {
    try {
      const bytes = new Uint8Array(buffer);
      
      // Try to decompress
      try {
        const decompressed = pako.inflate(bytes);
        const jsonString = new TextDecoder().decode(decompressed);
        return JSON.parse(jsonString);
      } catch (inflateError) {
        // If decompression fails, it might be plain text/JSON in the buffer
        const plainString = new TextDecoder().decode(bytes);
        if (plainString.trim().startsWith('{') || plainString.trim().startsWith('[')) {
          return JSON.parse(plainString);
        }
        throw inflateError; // Re-throw if it's clearly not JSON either
      }
    } catch (error) {
      console.error("Buffer decompression failed:", error);
      return null;
    }
  }
};
