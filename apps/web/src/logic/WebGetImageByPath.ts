import type {
	GetImageByPathOptions,
	GetImageByPathResult,
} from "@ext/markdown/elements/image/export/NextImageProcessor";
import { WebImageProccessor } from "@ext/markdown/elements/image/export/WebImageProcessor";

const getImageByPath = (options: GetImageByPathOptions): Promise<GetImageByPathResult> => {
	return WebImageProccessor.getImageByPath(options);
};

export default getImageByPath;
