import {Readable, Transform} from 'stream';
import {opus} from 'prism-media';
import {Lame} from 'node-lame';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AudioUtils {
    export function convertBufferToMp3Buffer(audioBuffer: Buffer, title: string, author: string): Promise<Buffer> {
        const encoder = new Lame({
            output: 'buffer',
            raw: true,
            sfreq: 48,
            bitwidth: 16,
            signed: true,
            'little-endian': true,
            mode: 's',
            meta: {
                title: title,
                artist: author,
            },
        }).setBuffer(audioBuffer);

        return encoder.encode().then(() => {
            return encoder.getBuffer();
        });
    }

    export function createSilenceStream(): Readable {
        const silenceReadable = new Readable();
        silenceReadable._read = function (size) {
            this.push(Buffer.from([0xf8, 0xff, 0xfe]));
        };
        return silenceReadable;
    }

    export function createOpusDecodingStream(): Transform {
        return new opus.Decoder({channels: 2, rate: 48000, frameSize: 960});
    }
}

function convertStereoBufferToMonoBuffer(buffer: Buffer): Buffer {
    const newBuffer = Buffer.alloc(buffer.length / 2);
    const HI = 1;
    const LO = 0;
    for (let i = 0; i < newBuffer.length / 2; ++i) {
        const left = (buffer[i * 4 + HI] << 8) | (buffer[i * 4 + LO] & 0xff);
        const right = (buffer[i * 4 + 2 + HI] << 8) | (buffer[i * 4 + 2 + LO] & 0xff);
        const avg = (left + right) / 2;
        newBuffer[i * 2 + HI] = (avg >> 8) & 0xff;
        newBuffer[i * 2 + LO] = avg & 0xff;
    }
    return newBuffer;
}
