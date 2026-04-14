import type { PageProps } from "@components/Pages/models/Pages";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type ContextService from "@core-ui/ContextServices/ContextService";
import { type ReactElement, useEffect } from "react";

export type PageDataUpdateEvents = Event<"update">;

class PagePropsUpdateService implements ContextService {
	private _events = createEventEmitter<PageDataUpdateEvents>();

	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }) {
		useEffect(() => {
			void this.events.emit("update", {});
		}, [pageProps]);

		return children;
	}

	get events() {
		return this._events;
	}
}

export default new PagePropsUpdateService();
