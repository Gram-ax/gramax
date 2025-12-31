import PageDataContext from "@core/Context/PageDataContext";
import type { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import type { PluginEventMap, PluginEventName } from "@gramax/sdk/events";
import { ServiceKey } from "@plugins/core/PluginContainer";
import { getPluginIsReady } from "@plugins/store";
import { PluginStore } from "@plugins/store/PluginStore";
import React, { useEffect, useRef } from "react";

type EventPayload<E extends PluginEventName> = Parameters<PluginEventMap[E]>[0];

type EventInputMap = {
	"app:open": { data: HomePageData | ArticlePageData; context: PageDataContext; path: string };
	"app:close": void;
	"article:open": { data: ArticlePageData };
	"article:close": void;
};

type EventInput<E extends PluginEventName> = EventInputMap[E];

export const emitPluginEvent = async <E extends PluginEventName>(
	event: E,
	payload?: EventPayload<E>,
): Promise<void | boolean> => {
	const state = PluginStore.getState();
	if (!state.pluginsReady || !state.manager) return;
	const events = state.manager.container.get(ServiceKey.Events);
	return events.emit(event, payload);
};

type EventHandler<TInput = void, TPayload = void> = {
	setup: (
		emit: (payload?: TPayload) => void,
		input?: TInput,
		firedRef?: React.MutableRefObject<boolean>,
	) => void | (() => void);
};

type EventHandlers = {
	[K in PluginEventName]: EventHandler<EventInput<K>, EventPayload<K>>;
};

const eventHandlers: Partial<EventHandlers> = {
	"app:open": {
		setup: (emit, rawData, firedRef) => {
			if (rawData === undefined || firedRef?.current) return;

			const payload = {
				data: rawData.data,
				context: rawData.context,
				path: rawData.path,
			};

			const checkAndEmit = () => {
				if (getPluginIsReady() && !firedRef.current) {
					firedRef.current = true;
					emit(payload);
					return true;
				}
				return false;
			};

			const unsubscribe = PluginStore.subscribe(() => {
				if (checkAndEmit()) unsubscribe();
			});
			return unsubscribe;
		},
	},
	"app:close": {
		setup: (emit) => {
			const handleBeforeUnload = () => emit();
			window.addEventListener("beforeunload", handleBeforeUnload);
			return () => window.removeEventListener("beforeunload", handleBeforeUnload);
		},
	},
	"article:open": {
		setup: (emit, rawData, firedRef) => {
			if (rawData === undefined) return;

			firedRef.current = false;

			const articleData = rawData.data;
			const payload = {
				context: {
					catalogName: articleData.catalogProps?.title,
					parentArticle: articleData.catalogProps?.title,
					articleName: articleData.articleProps?.title,
					path: articleData.articleProps?.pathname,
				},
			};

			if (getPluginIsReady()) {
				firedRef.current = true;
				emit(payload);
				return;
			}
		},
	},
	"article:close": {
		setup: () => {},
	},
};

export const usePluginEvent = <E extends PluginEventName>(
	event: E,
	input?: EventInput<E> extends void ? never : EventInput<E>,
) => {
	const handler = eventHandlers[event];
	const firedRef = useRef(false);

	useEffect(() => {
		if (!handler) return;
		const emit = (p: EventPayload<E>) => void emitPluginEvent(event, p);
		return handler.setup(emit, input, firedRef);
	}, [event, input, handler]);
};
