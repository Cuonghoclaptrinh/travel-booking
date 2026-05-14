    import crypto from 'crypto';
    import qs from 'qs';

    export type VnpayParams = Record<string, string | number | undefined | null>;

    export function formatVnpayDate(date: Date): string {
        const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);

        const yyyy = vietnamTime.getUTCFullYear().toString();
        const MM = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
        const dd = vietnamTime.getUTCDate().toString().padStart(2, '0');
        const HH = vietnamTime.getUTCHours().toString().padStart(2, '0');
        const mm = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
        const ss = vietnamTime.getUTCSeconds().toString().padStart(2, '0');

        return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
    }

    export function sortVnpayParams(params: VnpayParams): Record<string, string> {
        const sorted: Record<string, string> = {};

        Object.keys(params)
            .filter((key) => {
                const value = params[key];
                return value !== undefined && value !== null && value !== '';
            })
            .sort()
            .forEach((key) => {
                sorted[key] = String(params[key]);
            });

        return sorted;
    }

    export function signVnpayParams(params: VnpayParams, secretKey: string): string {
        const sortedParams = sortVnpayParams(params);

        const signData = qs.stringify(sortedParams, {
            encode: false,
        });

        return crypto
            .createHmac('sha512', secretKey)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');
    }

    export function buildVnpayPaymentUrl(
        paymentUrl: string,
        params: VnpayParams,
        secretKey: string,
    ): string {
        const sortedParams = sortVnpayParams(params);
        const secureHash = signVnpayParams(sortedParams, secretKey);

        const query = qs.stringify(
            {
                ...sortedParams,
                vnp_SecureHash: secureHash,
            },
            {
                encode: false,
            },
        );

        return `${paymentUrl}?${query}`;
    }

    export function verifyVnpaySignature(
        query: Record<string, any>,
        secretKey: string,
    ): boolean {
        const secureHash = query.vnp_SecureHash;

        if (!secureHash) {
            return false;
        }

        const cloned: VnpayParams = { ...query };
        delete cloned.vnp_SecureHash;
        delete cloned.vnp_SecureHashType;

        const signed = signVnpayParams(cloned, secretKey);

        return String(secureHash).toLowerCase() === signed.toLowerCase();
    }