import createEmotionServer from "@emotion/server/create-instance";
import createCache from "../../../../node_modules/@emotion/cache/dist/emotion-cache.esm.js";

function createServerContainer() {
	const nodes: unknown[] = [];
	return {
		childNodes: nodes,
		insertBefore(node: unknown) {
			nodes.push(node);
			return node;
		},
		appendChild(node: unknown) {
			nodes.push(node);
			return node;
		},
		querySelectorAll() {
			return [];
		},
	} as unknown as HTMLElement;
}
const cache = createCache({ key: "css", container: createServerContainer() });
const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

export default {
	cache,
	extractCriticalToChunks,
	constructStyleTagsFromChunks,
};
