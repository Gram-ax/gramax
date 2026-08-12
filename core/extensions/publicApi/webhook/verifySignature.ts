import { createHmac, timingSafeEqual } from "crypto";

const timingSafeStringEqual = (a: string, b: string): boolean => {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) return false;
	return timingSafeEqual(aBuf, bBuf);
};

export const verifyGitHubSignature = (
	rawBody: string,
	signatureHeader: string | undefined,
	secret: string,
): boolean => {
	if (!signatureHeader) return false;
	const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
	return timingSafeStringEqual(expected, signatureHeader);
};

export const verifyToken = (tokenHeader: string | undefined, secret: string): boolean => {
	if (!tokenHeader) return false;
	return timingSafeStringEqual(tokenHeader, secret);
};
