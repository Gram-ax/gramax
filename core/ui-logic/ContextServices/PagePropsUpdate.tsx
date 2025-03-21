import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import { ReactElement, useEffect } from "react";

export type PageDataUpdateEvents = Event<"update">;

abstract class PagePropsUpdateService {
	private static _events = createEventEmitter<PageDataUpdateEvents>();
	static get events() {
		return PagePropsUpdateService._events;
	}
	static Provider = ({ children, pageData }: { children: ReactElement; pageData: any }) => {
		useEffect(() => {
			void PagePropsUpdateService.events.emit("update", {});
		}, [pageData]);
		return children;
	};
}

export default PagePropsUpdateService;
