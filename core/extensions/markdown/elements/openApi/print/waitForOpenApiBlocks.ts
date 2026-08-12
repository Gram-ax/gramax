import type { OpenApiDocElement } from "@gramax/openapi-viewer";

const BLOCK_SELECTOR = '[data-testid="open-api"]';
/** A spec that never resolves must not hold the export hostage: past this the block goes to paper as it stands. */
const RENDER_TIMEOUT_MS = 15_000;

/**
 * The viewer is lazy twice over — its chunk is imported on demand, and the spec is fetched after that — so a
 * block is still an empty skeleton when React reports the article as rendered. Settled means the document is
 * on the page (the element has a model) or the block gave up and rendered its error instead.
 */
const blockSettled = (block: Element): boolean => {
	const doc = block.querySelector<OpenApiDocElement>("openapi-doc");
	if (doc) return !!doc.model;
	// No viewer at all: either the error branch replaced the block, or the lazy chunk has not arrived yet.
	return !block.querySelector(".openapi-block");
};

/**
 * Holds pagination until every OpenAPI block in the print source has its final height.
 *
 * The paginator measures each top-level node once and then lifts it into a fixed-height page box. A block
 * that grows after that measurement no longer fits the box it was placed in, and everything laid out after
 * it sits under content that is taller than the paginator was told.
 *
 * Resolves (never rejects) on abort: the caller re-checks its own signal and stops there.
 */
export const waitForOpenApiBlocks = (source: HTMLElement, signal?: AbortSignal): Promise<void> => {
	const blocks = Array.from(source.querySelectorAll(BLOCK_SELECTOR));
	if (!blocks.length || blocks.every(blockSettled) || signal?.aborted) return Promise.resolve();

	return new Promise<void>((resolve) => {
		const observer = new MutationObserver(() => check());
		const stop = () => {
			clearTimeout(timer);
			observer.disconnect();
			source.removeEventListener("openapi-updated", check);
			signal?.removeEventListener("abort", stop);
			resolve();
		};
		const check = () => {
			if (blocks.every(blockSettled)) stop();
		};
		const timer = setTimeout(stop, RENDER_TIMEOUT_MS);

		// The element announces every render with a bubbling `openapi-updated`; the observer covers what the
		// element cannot announce — its lazy chunk arriving, and the block swapping itself for an error.
		source.addEventListener("openapi-updated", check);
		observer.observe(source, { childList: true, subtree: true });
		signal?.addEventListener("abort", stop);
		check();
	});
};

export default waitForOpenApiBlocks;
