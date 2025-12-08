declare global {
	interface Array<T> {
		mapAsync<U>(
			callback: (value: T, index: number, array: T[]) => Promise<U>,
			concurrencyLimit?: number,
		): Promise<U[]>;
		forEachAsync(
			callback: (value: T, index: number, array: T[]) => Promise<void>,
			concurrencyLimit?: number,
		): Promise<void>;
		waitAll(): Promise<T[]>;
		waitAllSettled(): Promise<PromiseSettledResult<T>[]>;
		waitAny(): Promise<T>;
		waitRace(): Promise<T>;
	}
}

type Callback<T, U> = (value: T, index: number, array: T[]) => Promise<U>;

function defineArrayProperty(name: string, value: any) {
	if (name in Array.prototype) return;
	Object.defineProperty(Array.prototype, name, {
		value,
		enumerable: false,
	});
}

defineArrayProperty("mapAsync", async function <
	T,
	U,
>(this: T[], callback: Callback<T, U>, concurrencyLimit: number = 5): Promise<U[]> {
	return asyncUtils.mapAsync(this, callback, concurrencyLimit);
});

defineArrayProperty("forEachAsync", async function <
	T,
>(this: T[], callback: Callback<T, void>, concurrencyLimit: number = 5): Promise<void> {
	return asyncUtils.forEachConcurrent(this, callback, concurrencyLimit);
});

defineArrayProperty("waitAll", async function <T>(this: Promise<T>[]): Promise<T[]> {
	return Promise.all(this);
});

defineArrayProperty("waitAllSettled", async function <T>(this: Promise<T>[]): Promise<PromiseSettledResult<T>[]> {
	return Promise.allSettled(this);
});

defineArrayProperty("waitAny", async function <T>(this: Promise<T>[]): Promise<T> {
	return Promise.any(this);
});

defineArrayProperty("waitRace", async function <T>(this: Promise<T>[]): Promise<T> {
	return Promise.race(this);
});

export const asyncUtils = {
	mapSeq: async <T, U>(array: T[], callback: Callback<T, U>): Promise<U[]> => {
		const results: U[] = [];
		for (let i = 0; i < array.length; i++) {
			const result = await callback(array[i], i, array);
			results.push(result);
		}
		return results;
	},

	forEachSeq: async <T>(array: T[], callback: Callback<T, void>): Promise<void> => {
		for (let i = 0; i < array.length; i++) {
			await callback(array[i], i, array);
		}
	},

	forEachConcurrent: async <T>(
		array: T[],
		callback: Callback<T, void>,
		concurrencyLimit: number = 5,
	): Promise<void> => {
		if (concurrencyLimit === 1) return asyncUtils.forEachSeq(array, callback);
		if (concurrencyLimit <= 0) concurrencyLimit = array.length;

		let index = 0;

		const worker = async (): Promise<void> => {
			while (index < array.length) {
				const currentIndex = index++;
				await callback(array[currentIndex], currentIndex, array);
			}
		};

		const workers = Array.from({ length: Math.min(concurrencyLimit, array.length) }, () => worker());
		await Promise.all(workers);
	},

	mapAsync: async <T, U>(array: T[], callback: Callback<T, U>, concurrencyLimit: number = 5): Promise<U[]> => {
		if (concurrencyLimit === 1) return asyncUtils.mapSeq(array, callback);
		if (concurrencyLimit <= 0) concurrencyLimit = array.length;

		const results: U[] = new Array(array.length);
		let index = 0;

		const worker = async (): Promise<void> => {
			while (index < array.length) {
				const currentIndex = index++;
				const result = await callback(array[currentIndex], currentIndex, array);
				results[currentIndex] = result;
			}
		};

		const workers = Array.from({ length: Math.min(concurrencyLimit, array.length) }, () => worker());
		await Promise.all(workers);
		return results;
	},
};

export default asyncUtils;
