import { createHmac } from "crypto";
import { verifyGitHubSignature, verifyToken } from "./verifySignature";

const SECRET = "test-secret";
const BODY = JSON.stringify({ ref: "refs/heads/main" });
const validSignature = `sha256=${createHmac("sha256", SECRET).update(BODY).digest("hex")}`;

describe("verifyGitHubSignature", () => {
	it("accepts a valid signature", () => {
		expect(verifyGitHubSignature(BODY, validSignature, SECRET)).toBe(true);
	});
	it("rejects a tampered body", () => {
		expect(verifyGitHubSignature(`${BODY}x`, validSignature, SECRET)).toBe(false);
	});
	it("rejects a wrong secret", () => {
		expect(verifyGitHubSignature(BODY, validSignature, "other")).toBe(false);
	});
	it("rejects a missing header", () => {
		expect(verifyGitHubSignature(BODY, undefined, SECRET)).toBe(false);
	});
	it("rejects a signature of different length without throwing", () => {
		expect(verifyGitHubSignature(BODY, "sha256=abc", SECRET)).toBe(false);
	});
});

describe("verifyToken", () => {
	it("accepts an equal token", () => {
		expect(verifyToken(SECRET, SECRET)).toBe(true);
	});
	it("rejects a different token", () => {
		expect(verifyToken("wrong-secret", SECRET)).toBe(false);
	});
	it("rejects a missing token", () => {
		expect(verifyToken(undefined, SECRET)).toBe(false);
	});
	it("rejects a token of different length without throwing", () => {
		expect(verifyToken("a", SECRET)).toBe(false);
	});
});
