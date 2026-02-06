import IsMobileService from "@core-ui/ContextServices/isMobileService";
import { MouseTransition, MultiBackend, TouchTransition } from "dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

const HTML5toTouch = {
	backends: [
		{
			id: "html5",
			backend: HTML5Backend,
			transition: MouseTransition,
			options: {},
			preview: false,
			skipDispatchOnTransition: false,
		},
		{
			id: "touch",
			backend: TouchBackend,
			transition: TouchTransition,
			options: {
				delay: 150,
				ignoreContextMenu: true,
				enableMouseEvents: true,
			},
			preview: true,
			skipDispatchOnTransition: true,
		},
	],
};

const createModifiedBackend = (backendFactory: any) => {
	return (manager: any, context: any, options: any) => {
		const backendInstance = backendFactory(manager, context, options);

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
			const original = backendInstance[name];
			if (typeof original === "function") {
				backendInstance[name] = (event: any, ...extraArgs: any[]) => {
					if (event?.target && shouldProcessEvent(event.target)) {
						original.call(backendInstance, event, ...extraArgs);
					}
				};
			}
		});

		return backendInstance;
	};
};

const shouldProcessEvent = (target: any): boolean => {
	return target instanceof Element && typeof target.closest === "function" && target.closest(".tree-root") !== null;
};

const modifiedHTML5toTouch = {
	backends: HTML5toTouch.backends.map((config) => ({
		...config,
		backend: createModifiedBackend(config.backend),
	})),
};

export const useDragDrop = () => {
	const isMobile = IsMobileService.value;

	return {
		backend: (manager: any) => MultiBackend(manager, undefined, modifiedHTML5toTouch),
		options: modifiedHTML5toTouch,
		currentBackendType: isMobile ? "touch" : "html5",
	};
};

export default modifiedHTML5toTouch;
