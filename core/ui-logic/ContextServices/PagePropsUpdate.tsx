import { PageProps } from "@components/ContextProviders";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import ContextService from "@core-ui/ContextServices/ContextService";
import { ReactElement, useEffect } from "react";

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
