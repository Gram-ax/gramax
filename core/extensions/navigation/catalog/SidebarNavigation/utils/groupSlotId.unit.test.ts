import { DropMode } from "./dropMode";
import { firstSlotId, groupIdFromSlotMode, lastSlotId, parseGroupSlotId } from "./groupSlotId";

describe("group slot ids", () => {
	test("round-trip a group id through its first slot", () => {
		const id = firstSlotId("docs/guide");

		expect(parseGroupSlotId(id)).toEqual({ groupId: "docs/guide", mode: DropMode.FirstChild });
		expect(groupIdFromSlotMode(id, DropMode.FirstChild)).toBe("docs/guide");
	});

	test("round-trip a group id through its last slot", () => {
		const id = lastSlotId("docs/guide");

		expect(parseGroupSlotId(id)).toEqual({ groupId: "docs/guide", mode: DropMode.LastChild });
		expect(groupIdFromSlotMode(id, DropMode.LastChild)).toBe("docs/guide");
	});

	test("a plain item id is not a slot", () => {
		expect(parseGroupSlotId("docs/guide")).toBeNull();
	});

	test("the suffix is only recognised at the end", () => {
		expect(parseGroupSlotId("docs/__first/page")).toBeNull();
	});
});
