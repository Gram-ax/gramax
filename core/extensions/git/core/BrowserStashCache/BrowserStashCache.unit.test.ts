import BrowserStashCache from "./BrowserStashCache";

jest.mock("@app/resolveModule/env", () => ({
	getExecutingEnvironment: jest.fn(),
}));

const envModule = jest.requireMock("@app/resolveModule/env");
const getExecutingEnvironment: jest.Mock = envModule.getExecutingEnvironment;

const LS_KEY = "last-stash-cache";

describe("BrowserStashCache", () => {
	beforeEach(() => {
		jest.useRealTimers();
		getExecutingEnvironment.mockReset();
		localStorage.clear();
		jest.spyOn(Storage.prototype, "setItem").mockClear();
		jest.spyOn(Storage.prototype, "getItem").mockClear();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe("validation dependent methods", () => {
		it("getStashCache returns [] when environment is not supported", () => {
			getExecutingEnvironment.mockReturnValue("node");
			const res = BrowserStashCache.getStashCache("catalog");
			expect(res).toEqual([]);
		});

		it("getAllStashCaches returns {} when environment is not supported", () => {
			getExecutingEnvironment.mockReturnValue("node");
			const res = BrowserStashCache.getAllStashCaches();
			expect(res).toEqual({});
		});

		it("setStashCache does nothing when environment is not supported", () => {
			getExecutingEnvironment.mockReturnValue("node");
			const setSpy = jest.spyOn(Storage.prototype, "setItem");
			BrowserStashCache.setStashCache("catalog", "oid-1");
			expect(setSpy).not.toHaveBeenCalled();
		});
	});

	describe("localStorage behavior in supported environment", () => {
		beforeEach(() => {
			getExecutingEnvironment.mockReturnValue("browser");
		});

		it("getAllStashCaches returns empty object when storage is empty", () => {
			const res = BrowserStashCache.getAllStashCaches();
			expect(res).toEqual({});
		});

		it("getAllStashCaches parses existing value from localStorage", () => {
			localStorage.setItem(LS_KEY, JSON.stringify({ a: [{ oid: "1", time: "t" }] }));
			const res = BrowserStashCache.getAllStashCaches();
			expect(res).toEqual({ a: [{ oid: "1", time: "t" }] });
		});

		it("getStashCache returns undefined when catalog does not exist", () => {
			const res = BrowserStashCache.getStashCache("unknown");
			expect(res).toBeUndefined();
		});

		it("setStashCache writes first item with correct timestamp", () => {
			jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			BrowserStashCache.setStashCache("cat", "oid-1");
			const raw = localStorage.getItem(LS_KEY);
			if (!raw) fail("Expected value in localStorage");
			const parsed = JSON.parse(raw);
			expect(Object.keys(parsed)).toEqual(["cat"]);
			expect(parsed.cat.length).toBe(1);
			expect(parsed.cat[0].oid).toBe("oid-1");
			expect(parsed.cat[0].time).toBe("2024-01-01T00:00:00.000Z");
		});

		it("setStashCache adds new item to the beginning (LIFO)", () => {
			jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			BrowserStashCache.setStashCache("cat", "oid-1");
			jest.setSystemTime(new Date("2024-01-01T00:00:10.000Z"));
			BrowserStashCache.setStashCache("cat", "oid-2");

			const raw = localStorage.getItem(LS_KEY);
			if (!raw) fail("Expected value in localStorage");
			const parsed = JSON.parse(raw);
			expect(parsed.cat.map((x: any) => x.oid)).toEqual(["oid-2", "oid-1"]);
			expect(parsed.cat[0].time).toBe("2024-01-01T00:00:10.000Z");
			expect(parsed.cat[1].time).toBe("2024-01-01T00:00:00.000Z");
		});

		it("trims catalog list to 20 items", () => {
			jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			for (let i = 0; i < 25; i++) {
				BrowserStashCache.setStashCache("cat", `oid-${i}`);
				jest.setSystemTime(new Date(Date.now() + 1000));
			}
			const raw = localStorage.getItem(LS_KEY);
			if (!raw) fail("Expected value in localStorage");
			const parsed = JSON.parse(raw);
			expect(parsed.cat.length).toBe(20);
			expect(parsed.cat[0].oid).toBe("oid-24");
			expect(parsed.cat[19].oid).toBe("oid-5");
		});

		it("removes the oldest catalog when exceeding 20 catalogs", () => {
			jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
			for (let i = 0; i < 21; i++) {
				BrowserStashCache.setStashCache(`cat-${i}`, `oid-${i}`);
				jest.setSystemTime(new Date(Date.now() + 1000));
			}

			const raw = localStorage.getItem(LS_KEY);
			if (!raw) fail("Expected value in localStorage");
			const parsed = JSON.parse(raw);
			const catalogs: string[] = Object.keys(parsed);
			expect(catalogs.length).toBe(20);
			expect(catalogs).not.toContain("cat-0");
			expect(catalogs).toEqual(expect.arrayContaining(["cat-1", "cat-20"]));
		});
	});
});
