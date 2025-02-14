import EventEmitter from "eventemitter3";
import { useState } from "react";

interface Events {
	itemTitleLinkClick: (payload: { path: string; href: string }) => void;
	ListLayoutOutsideClick: (payload: { e: MouseEvent; callback: () => void }) => void;
	closeTitleTooltip: () => void;
}

const eventEmitter = new EventEmitter<Events>();

export function useEventEmitter<T extends object>() {
	const [eventEmitter] = useState<EventEmitter<T>>(() => new EventEmitter<T>());

	return eventEmitter;
}

export default eventEmitter;
