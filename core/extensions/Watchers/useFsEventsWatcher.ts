import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useApiEvent } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useItemLinksStore } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import type { FsEventDto } from "@ext/Watchers/FsEvent";
import FsEventsBatcher from "@ext/Watchers/FsEventsBatcher";
import { shouldPauseFsEventsForCommand } from "@ext/Watchers/fsEventPause";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

type FsHandleResult = {
	changedArticles: string[];
	navChanged: boolean;
	itemLinks: ItemLink[] | null;
	currentArticleRedirectTo: string | null;
	modifiedArticleProps?: { path: string; props: Partial<ItemLink> }[];
};

const useFsEventsWatcher = (): void => {
	const { isTauri } = usePlatform();
	const workspacePath = PageDataContextService.value?.workspace?.current;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const router = useRouter();
	const currentArticlePath = useArticlePropsStore((state) => state?.data?.ref?.path);
	const catalogName = useCatalogPropsStore((state) => state?.data?.name);
	const setItemLinks = useItemLinksStore((state) => state?.setItemLinks);
	const patchItemProps = useItemLinksStore((state) => state?.patchItemProps);

	const articleRef = useRef(currentArticlePath);
	articleRef.current = currentArticlePath;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	apiUrlCreatorRef.current = apiUrlCreator;
	const catalogNameRef = useRef(catalogName);
	catalogNameRef.current = catalogName;
	const setItemLinksRef = useRef(setItemLinks);
	setItemLinksRef.current = setItemLinks;
	const patchItemPropsRef = useRef(patchItemProps);
	patchItemPropsRef.current = patchItemProps;
	const routerRef = useRef(router);
	routerRef.current = router;
	const fsEventsPauseCountRef = useRef(0);
	const batcherRef = useRef<FsEventsBatcher<FsEventDto>>();

	useApiEvent("on-will-command", ({ command }) => {
		if (shouldPauseFsEventsForCommand(command)) fsEventsPauseCountRef.current += 1;
	});

	useApiEvent("on-settled-command", ({ command }) => {
		if (shouldPauseFsEventsForCommand(command))
			fsEventsPauseCountRef.current = Math.max(0, fsEventsPauseCountRef.current - 1);
		if (batcherRef.current?.canFlush()) void batcherRef.current?.flushNow();
	});

	useEffect(() => {
		if (!isTauri || !workspacePath) return;

		let unlisten: (() => void) | undefined;
		let stopped = false;

		const batcher = new FsEventsBatcher<FsEventDto>(
			async (events) => {
				if (!apiUrlCreatorRef.current) return;

				const res = await FetchService.fetch<FsHandleResult>(
					apiUrlCreatorRef.current.handleFsEvents(),
					JSON.stringify({
						events,
						currentPath: articleRef.current,
						catalogName: catalogNameRef.current,
					}),
					MimeTypes.json,
				);
				if (!res.ok) return;
				const result = (await res.json?.()) as FsHandleResult | null;
				if (!result) return;
				if (result.itemLinks) setItemLinksRef.current?.(result.itemLinks);
				else if (result.modifiedArticleProps?.length) {
					patchItemPropsRef.current?.(result.modifiedArticleProps);
				}
				const cur = articleRef.current;
				const creator = apiUrlCreatorRef.current;
				const articleStillExists = !result.currentArticleRedirectTo;
				if (cur && creator && articleStillExists && result.changedArticles.includes(cur)) {
					void ArticleUpdaterService.update(creator);
				}
				if (result.currentArticleRedirectTo) {
					void routerRef.current.pushPath(result.currentArticleRedirectTo);
				}
			},
			{ canFlush: () => fsEventsPauseCountRef.current === 0 },
		);
		batcherRef.current = batcher;

		// biome-ignore lint/nursery/noFloatingPromises: idc
		(async () => {
			unlisten = await listen<{ id: number; events: FsEventDto[] }>("fs-event", (ev) => {
				batcher.enqueue(ev.payload.events);
			});
			if (stopped) unlisten?.();
		})();

		return () => {
			stopped = true;
			unlisten?.();
			batcher.stop();
			if (batcherRef.current === batcher) batcherRef.current = undefined;
		};
	}, [isTauri, workspacePath]);
};

export default useFsEventsWatcher;
