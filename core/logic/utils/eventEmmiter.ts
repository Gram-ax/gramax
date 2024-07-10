import EventEmitter from "eventemitter3";

interface Events {
	itemTitleLinkClick: (payload: { path: string; href: string }) => void;
	ListLayoutOutsideClick: (payload: { e: MouseEvent; callback: () => void }) => void;
	closeTitleTooltip: () => void;
}

const eventEmitter = new EventEmitter<Events>();

export default eventEmitter;
