import type { ResourceType } from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import { DIAGRAM_FILE_TYPES, IMG_FILE_TYPES, KNOWN_TEXT_EXTENSIONS } from "@ext/git/actions/Publish/model/consts";

const resolveResourceTypeByExtension = (extension: string): ResourceType => {
	if (IMG_FILE_TYPES.includes(extension)) {
		return "image";
	}

	if (DIAGRAM_FILE_TYPES[extension]) {
		return "diagram";
	}

	if (KNOWN_TEXT_EXTENSIONS.includes(extension)) {
		return "text";
	}

	return "unknown";
};

export default resolveResourceTypeByExtension;
