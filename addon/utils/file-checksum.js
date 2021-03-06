import { Promise as EmberPromise } from 'rsvp';

export default class FileChecksum {
  constructor(file) {
    this.file = file;
    this.chunkSize = 2097152; // 2MB
    this.chunkCount = Math.ceil(this.file.size / this.chunkSize);
    this.chunkIndex = 0;
    this.fileSlice =
      File.prototype.slice ||
      File.prototype.mozSlice ||
      File.prototype.webkitSlice;
  }

  createMD5() {
    return new EmberPromise((resolve, reject) => {
      this.md5Buffer = new SparkMD5.ArrayBuffer();
      this.fileReader = new FileReader();

      this.fileReader.onload = (event) => {
        this.md5Buffer.append(event.target.result);

        if (!this.readNextChunk()) {
          const binaryDigest = this.md5Buffer.end(true);
          const base64digest = btoa(binaryDigest);
          resolve(base64digest);
        }
      };

      this.fileReader.onerror = (error) => {
        reject(error);
      };

      this.readNextChunk();
    });
  }

  readNextChunk() {
    if (this.chunkIndex < this.chunkCount) {
      const start = this.chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const bytes = this.fileSlice.call(this.file, start, end);
      this.fileReader.readAsArrayBuffer(bytes);
      this.chunkIndex++;
      return true;
    } else {
      return false;
    }
  }

  static MD5(file) {
    return new FileChecksum(file).createMD5();
  }
}
