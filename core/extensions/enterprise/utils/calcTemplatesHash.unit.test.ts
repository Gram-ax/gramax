import { XxHash } from "@core/Hash/Hasher";
import { calcTemplatesHash } from "./calcTemplatesHash";

describe("calcTemplatesHash (client)", () => {
	beforeAll(async () => await XxHash.init());

	const templateA = { title: "a.docx", bufferBase64: "AAAA" };
	const templateB = { title: "b.docx", bufferBase64: "BBBB" };

	it("returns same hash for same set in different order", () => {
		const hash1 = calcTemplatesHash([templateA, templateB]);
		const hash2 = calcTemplatesHash([templateB, templateA]);
		expect(hash1).toBe(hash2);
	});

	it("detects difference when content changes", () => {
		const hash1 = calcTemplatesHash([templateA]);
		const modified = { ...templateA, bufferBase64: "AAAA_changed" };
		const hash2 = calcTemplatesHash([modified]);
		expect(hash1).not.toBe(hash2);
	});
});
