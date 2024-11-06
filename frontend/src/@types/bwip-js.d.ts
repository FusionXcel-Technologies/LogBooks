declare module 'bwip-js' {
    export interface BWIPJSOptions {
        bcid: string; // Barcode type
        text: string; // Text to encode
        scale?: number; // Scaling factor
        height?: number; // Height of the bars in millimeters
        includetext?: boolean; // Whether to include the text
        textxalign?: string; // Text alignment
        background?: string; // Background color
        color?: string; // Bar color
        textcolor?: string; // Text color
    }

    export function toBuffer(
        options: BWIPJSOptions,
        callback: (err: Error | null, buffer: Buffer) => void
    ): void;
}
