import { throwIfAborted } from "./abort";

const IMAGE_LOAD_TIMEOUT_MS = 30_000;
const CSS_URL_PATTERN = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi;
const IMAGE_DATA_URL_PATTERN = /^data:image\//i;
const IMAGE_FILE_URL_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

const getImageUrls = (cssText: string): string[] => {
	const urls = new Set<string>();

	for (const match of cssText.matchAll(CSS_URL_PATTERN)) {
		const url = (match[1] ?? match[2] ?? match[3] ?? "").trim();
		if (IMAGE_DATA_URL_PATTERN.test(url) || IMAGE_FILE_URL_PATTERN.test(url)) urls.add(url);
	}

	return [...urls];
};

const waitForImage = (url: string, signal?: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		let settled = false;
		const image = new Image();

		const cleanup = () => {
			clearTimeout(timeout);
			signal?.removeEventListener("abort", handleAbort);
			image.onload = null;
			image.onerror = null;
		};

		const complete = () => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve();
		};

		const fail = (error: unknown) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error);
		};

		const handleAbort = () => {
			try {
				throwIfAborted(signal);
			} catch (error) {
				fail(error);
			}
		};

		const timeout = setTimeout(complete, IMAGE_LOAD_TIMEOUT_MS);
		signal?.addEventListener("abort", handleAbort, { once: true });

		image.onload = () => {
			if (typeof image.decode !== "function") {
				complete();
				return;
			}

			void image.decode().then(complete, complete);
		};
		image.onerror = complete;
		image.src = url;

		handleAbort();
	});

export const waitForPrintTemplateImages = async (cssText: string, signal?: AbortSignal): Promise<void> => {
	throwIfAborted(signal);
	await Promise.all(getImageUrls(cssText).map((url) => waitForImage(url, signal)));
	throwIfAborted(signal);
};
