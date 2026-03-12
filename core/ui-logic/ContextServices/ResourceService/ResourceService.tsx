import {
	ResourceServiceContext,
	type ResourceServiceType,
	ResourceStoreProvider,
} from "@core-ui/ContextServices/ResourceService/store/ResourceStore.provider";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { type ReactElement, useContext } from "react";

interface ResourceServiceProps {
	children: ReactElement;
	id?: string;
	provider?: ArticleProviderType;
}

// biome-ignore lint/complexity/noStaticOnlyClass: kk
abstract class ResourceService {
	static _loadingPromises = new Set<Promise<void>>();

	static Provider({ children, provider, id }: ResourceServiceProps) {
		return (
			<ResourceStoreProvider id={id} provider={provider}>
				{children}
			</ResourceStoreProvider>
		);
	}

	static get value(): ResourceServiceType {
		return useContext(ResourceServiceContext);
	}

	static async waitForAllLoads(signal?: AbortSignal) {
		const yieldThread = () =>
			new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});

		while (ResourceService._loadingPromises.size) {
			if (signal?.aborted) return;
			const pending = Array.from(ResourceService._loadingPromises);
			await Promise.race([Promise.allSettled(pending), yieldThread()]);
		}
	}
}

export type { ResourceServiceType } from "./store/ResourceStore.provider";
export default ResourceService;
