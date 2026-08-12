// An OS file dropped outside the editor makes the webview/browser navigate to the file (file://…),
// which reloads the app to the homepage. Swallow file drops that no editor handler claimed so the
// default navigation never happens. Internal element drag-n-drop (nav tree, editor nodes) carries
// non-file data types, so it is left untouched. Returns a disposer that removes the listeners.
const preventFileDropNavigation = (): (() => void) => {
	const swallowFileDrop = (event: DragEvent) => {
		if (!event.dataTransfer?.types.includes("Files")) return;
		event.preventDefault();
	};
	window.addEventListener("dragover", swallowFileDrop);
	window.addEventListener("drop", swallowFileDrop);
	return () => {
		window.removeEventListener("dragover", swallowFileDrop);
		window.removeEventListener("drop", swallowFileDrop);
	};
};

export default preventFileDropNavigation;
