import {PassThrough, Readable} from 'stream';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace StreamUtils {
    export function merge(...streams: Readable[]): Readable {
        let pass = new PassThrough();
        let waiting = streams.length;
        for (const stream of streams) {
            pass = stream.pipe(pass, {end: false});
            stream.once('end', () => waiting-- === 0 && pass.end());
        }
        return pass;
    }

    export function mergeAsync(...streams: Readable[]): Readable {
        function pipeNext(): void {
            const nextStream = streams.shift();
            if (nextStream) {
                nextStream.pipe(out, {end: false});
                nextStream.on('end', () => {
                    pipeNext();
                });
            } else {
                out.end();
            }
        }
        const out = new PassThrough();
        pipeNext();
        return out;
    }
}
