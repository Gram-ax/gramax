import { HTML5Backend } from "react-dnd-html5-backend";

const ModifiedBackend = (manager) => {
	const backend = HTML5Backend(manager);

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
	return target instanceof Element && target.closest(".tree-root") !== null;
};

export default ModifiedBackend;
