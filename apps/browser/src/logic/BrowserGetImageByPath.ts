import { BrowserImageProccessor } from "@ext/markdown/elements/image/export/BrowserImageProcessor";
import type {
	GetImageByPathOptions,
	GetImageByPathResult,
} from "@ext/markdown/elements/image/export/NextImageProcessor";

const getImageByPath = (options: GetImageByPathOptions): Promise<GetImageByPathResult> => {
	return BrowserImageProccessor.getImageByPath(options);
};

export default getImageByPath;
