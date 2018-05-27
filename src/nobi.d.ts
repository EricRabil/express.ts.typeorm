interface Nobi {
    sign(value: string): string;
    unsign(data: string): string;
}

interface TimestampSigner extends Nobi {
    unsign(data: string, opts?: {maxAge?: number}): string;
}

declare type SignerOptions = {salt?: string, sep?: string, digestMethod?: string};

declare function nobi (secret: string, opts?: SignerOptions): Nobi;

declare namespace nobi {
    export function timestampSigner(secret: string, opts?: SignerOptions): TimestampSigner;
}

declare module "nobi" {
    export = nobi;
}