import { markWebhookPull, releasePull, shouldSkipAutoPull, tryAcquirePull } from "./PullDebounce";

describe("PullDebounce", () => {
	afterEach(() => {
		jest.restoreAllMocks();
		releasePull("cat");
	});

	it("skips autopull within the debounce window", () => {
		jest.spyOn(Date, "now").mockReturnValue(1_000_000);
		markWebhookPull("cat");
		jest.spyOn(Date, "now").mockReturnValue(1_000_000 + 100_000);
		expect(shouldSkipAutoPull("cat", 180_000)).toBe(true);
	});

	it("does not skip after the window passes", () => {
		jest.spyOn(Date, "now").mockReturnValue(1_000_000);
		markWebhookPull("cat");
		jest.spyOn(Date, "now").mockReturnValue(1_000_000 + 200_000);
		expect(shouldSkipAutoPull("cat", 180_000)).toBe(false);
	});

	it("does not skip a catalog never pulled by webhook", () => {
		expect(shouldSkipAutoPull("never-seen", 180_000)).toBe(false);
	});

	it("in-flight guard: second acquire fails until release", () => {
		expect(tryAcquirePull("cat")).toBe(true);
		expect(tryAcquirePull("cat")).toBe(false);
		releasePull("cat");
		expect(tryAcquirePull("cat")).toBe(true);
	});
});
