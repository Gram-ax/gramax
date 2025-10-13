import type { Stackframe } from "@bugsnag/js";

const normalizeStacktrace = (stack: Stackframe[]): Stackframe[] => {
	return stack.map((frame) => {
		frame.file = frame.file.replace(/(?:https?|tauri):\/\/[^/]+|tauri:\/\/[^/]+/g, "");
		return frame;
	});
};

export default normalizeStacktrace;
