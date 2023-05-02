import {Duplex, Writable} from 'stream';
import {CachingStream, CreateStreamFromBuffer} from './CachingStream';

const MAX_BUFFER_SIZE = 500; // Buffer in seconds is approximately MAX_BUFFER_SIZE / 50
const DEBOUNCE_TIME = 30; // Debounce time for inserting silence (Don't want to accidentally insert silence)

export default class RecordingStream extends Writable implements CachingStream {
    private rollingBuffer: Buffer[] = [];
    private rollingBufferWithSilence: Buffer[] = [];

    private isWriting = false;
    private readonly createSilenceStream: boolean;
    private readonly maxBufferSize: number;
    private silenceDebouncer: NodeJS.Timeout | undefined = undefined;

    constructor(maxBufferSize = MAX_BUFFER_SIZE, createSilenceStream = false) {
        super();
        this.createSilenceStream = createSilenceStream;
        this.maxBufferSize = maxBufferSize;
    }

    getCachedStream(lengthInSeconds: number = MAX_BUFFER_SIZE / 50, withSilence = false): Duplex {
        this.isWriting = true;
        const stream = CreateStreamFromBuffer(this.getCachedBuffer(lengthInSeconds, withSilence));
        this.isWriting = false;
        return stream;
    }

    getCachedBuffer(lengthInSeconds: number = MAX_BUFFER_SIZE / 50, withSilence = false): Buffer {
        const buffer = !withSilence ? this.rollingBuffer : this.rollingBufferWithSilence;
        const samplesPerSecond = 48000;
        const bytesPerSample = 2;
        const channels = 2;
        const numberOfBytes = lengthInSeconds * samplesPerSecond * bytesPerSample * channels;
        if (buffer.length === 0) {
            return Buffer.alloc(0);
        }
        const numberOfChunks = Math.min(numberOfBytes / buffer[0].length, MAX_BUFFER_SIZE);
        return Buffer.concat(buffer.slice(-numberOfChunks));
    }

    override _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        this.insertChunk(this.rollingBuffer, chunk);
        if (this.createSilenceStream) {
            this.insertSilentChunk(chunk)
        }
        callback();
    }

    insertSilentChunk(chunk: any) {
        this.insertChunk(this.rollingBufferWithSilence, chunk, true);
    }

    private insertChunk(buffer: Buffer[], chunk: any, isSilenceChunk = false) {
        if (!this.isWriting && !(isSilenceChunk && this.silenceDebouncer)) {
            if (buffer.length > MAX_BUFFER_SIZE) {
                // Chunk size ~3840
                buffer.shift();
            }
            buffer.push(chunk);
            if (!isSilenceChunk) {
                this.resetSilenceDebounce();
            }
        }
    }

    private resetSilenceDebounce() {
        if (this.silenceDebouncer) {
            clearTimeout(this.silenceDebouncer);
        }
        this.silenceDebouncer = setTimeout(() => {
            this.silenceDebouncer = undefined;
        }, DEBOUNCE_TIME);
    }
}
