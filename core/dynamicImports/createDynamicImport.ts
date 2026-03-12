import { getExecutingEnvironment } from "@app/resolveModule/env";

export interface DynamicImportOptions<T> {
	importFunction: () => Promise<T>;
	skipPreload?: boolean;
}

export const createDynamicImport = <T>({ importFunction, skipPreload }: DynamicImportOptions<T>) => {
	let cachedPromise: Promise<T> | null = null;

	const dynamicImport = (): Promise<T> => {
		if (cachedPromise === null) {
			cachedPromise = importFunction();
		}
		return cachedPromise;
	};

	const preloadSoon = (): void => {
		if (skipPreload || getExecutingEnvironment() === "static" || getExecutingEnvironment() === "cli") return;

		typeof queueMicrotask === "function"
			? queueMicrotask(() => void dynamicImport())
			: setTimeout(() => void dynamicImport(), 0);
	};

	preloadSoon();

	return dynamicImport;
};
