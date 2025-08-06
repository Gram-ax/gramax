import IsMobileService from "@core-ui/ContextServices/isMobileService";
import { getBackendOptions } from "@minoru/react-dnd-treeview";
import { HTML5Backend, HTML5BackendOptions } from "react-dnd-html5-backend";
import { TouchBackend, TouchBackendOptions } from "react-dnd-touch-backend";

const getDefaultBackendOptions = (): { html5: Partial<HTML5BackendOptions>; touch: Partial<TouchBackendOptions> } => {
	return {
		html5: {},
		touch: {
			delayTouchStart: 300,
			touchSlop: 16,
			ignoreContextMenu: true,
			scrollAngleRanges: [
				{ start: 30, end: 150 },
				{ start: 210, end: 330 },
			],
		},
	};
};

export const useDragDrop = () => {
	const isMobile = IsMobileService.value;
	const backend = isMobile ? TouchBackend : HTML5Backend;
	const options = getBackendOptions(getDefaultBackendOptions());

	return { backend, options };
};

const ModifiedBackend = (backend: any) => {
	const listeners = [
		"handleTopDragStart",
		"handleTopDragStartCapture",
		"handleTopDragEndCapture",
		"handleTopDragEnter",
		"handleTopDragEnterCapture",
		"handleTopDragLeaveCapture",
		"handleTopDragOver",
		"handleTopDragOverCapture",
		"handleTopDrop",
		"handleTopDropCapture",
	];

	listeners.forEach((name) => {
		const original = backend[name];
		backend[name] = (event, ...extraArgs) => {
			if (event?.target && shouldProcessEvent(event.target)) original(event, ...extraArgs);
		};
	});

	return backend;
};

const shouldProcessEvent = (target: any): boolean => {
	return target instanceof Element && typeof target.closest === "function" && target.closest(".tree-root") !== null;
};

export default ModifiedBackend;
