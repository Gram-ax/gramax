import { renderHook } from "@testing-library/react";
import { useCachedLookup } from "../useCachedLookup";

interface Item {
	email: string;
	name: string;
}

const getEmail = (x: Item) => x.email;
const lower = (key: string) => key.toLowerCase();

const render = (resolve: (keys: string[]) => Promise<Item[]>) =>
	renderHook(() => useCachedLookup(resolve, getEmail, lower));

describe("useCachedLookup", () => {
	it("requests every key on first call", async () => {
		const resolve = jest.fn().mockResolvedValue([{ email: "a@test.com", name: "A" }]);
		const { result } = render(resolve);

		const found = await result.current(["a@test.com", "b@test.com"]);

		expect(resolve).toHaveBeenCalledWith(["a@test.com", "b@test.com"]);
		expect(found).toEqual([{ email: "a@test.com", name: "A" }]);
	});

	it("requests only keys missing from the cache", async () => {
		const resolve = jest
			.fn()
			.mockResolvedValueOnce([{ email: "a@test.com", name: "A" }])
			.mockResolvedValueOnce([{ email: "b@test.com", name: "B" }]);
		const { result } = render(resolve);

		await result.current(["a@test.com"]);
		const found = await result.current(["a@test.com", "b@test.com"]);

		expect(resolve).toHaveBeenNthCalledWith(2, ["b@test.com"]);
		expect(found).toEqual([
			{ email: "a@test.com", name: "A" },
			{ email: "b@test.com", name: "B" },
		]);
	});

	it("does not request again when nothing is missing", async () => {
		const resolve = jest.fn().mockResolvedValue([{ email: "a@test.com", name: "A" }]);
		const { result } = render(resolve);

		await result.current(["a@test.com"]);
		await result.current(["a@test.com"]);

		expect(resolve).toHaveBeenCalledTimes(1);
	});

	it("caches unresolved keys so they are not requested again", async () => {
		const resolve = jest.fn().mockResolvedValue([]);
		const { result } = render(resolve);

		await result.current(["ghost@test.com"]);
		const found = await result.current(["ghost@test.com"]);

		expect(resolve).toHaveBeenCalledTimes(1);
		expect(found).toEqual([]);
	});

	it("treats keys differing only by case as one entry", async () => {
		const resolve = jest.fn().mockResolvedValue([{ email: "Ivan@corp.ru", name: "Ivan" }]);
		const { result } = render(resolve);

		await result.current(["Ivan@corp.ru"]);
		const found = await result.current(["ivan@corp.ru"]);

		expect(resolve).toHaveBeenCalledTimes(1);
		expect(found).toEqual([{ email: "Ivan@corp.ru", name: "Ivan" }]);
	});

	it("deduplicates repeated keys in one request", async () => {
		const resolve = jest.fn().mockResolvedValue([{ email: "a@test.com", name: "A" }]);
		const { result } = render(resolve);

		await result.current(["a@test.com", "A@test.com"]);

		expect(resolve).toHaveBeenCalledTimes(1);
		expect(resolve.mock.calls[0][0]).toHaveLength(1);
	});

	it("matches keys exactly when no normalizer is given", async () => {
		const resolve = jest.fn().mockResolvedValue([{ email: "Ivan@corp.ru", name: "Ivan" }]);
		const { result } = renderHook(() => useCachedLookup(resolve, getEmail));

		await result.current(["Ivan@corp.ru"]);
		const found = await result.current(["ivan@corp.ru"]);

		expect(resolve).toHaveBeenNthCalledWith(2, ["ivan@corp.ru"]);
		expect(found).toEqual([]);
	});

	it("keeps the key uncached when the resolver rejects", async () => {
		const resolve = jest.fn().mockRejectedValueOnce(new Error("sso down")).mockResolvedValue([]);
		const { result } = render(resolve);

		await expect(result.current(["a@test.com"])).rejects.toThrow("sso down");
		await result.current(["a@test.com"]);

		expect(resolve).toHaveBeenCalledTimes(2);
	});

	it("drops the cache when the resolver identity changes", async () => {
		const first = jest.fn().mockResolvedValue([{ email: "a@test.com", name: "A" }]);
		const second = jest.fn().mockResolvedValue([{ email: "a@test.com", name: "A2" }]);
		const { result, rerender } = renderHook(({ resolve }) => useCachedLookup(resolve, getEmail, lower), {
			initialProps: { resolve: first },
		});

		await result.current(["a@test.com"]);
		rerender({ resolve: second });
		const found = await result.current(["a@test.com"]);

		expect(second).toHaveBeenCalledWith(["a@test.com"]);
		expect(found).toEqual([{ email: "a@test.com", name: "A2" }]);
	});
});
