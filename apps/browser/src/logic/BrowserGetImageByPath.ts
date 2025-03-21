import { BrowserImageProccessor } from "@ext/markdown/elements/image/export/BrowserImageProcessor";
import { GetImageByPathOptions, GetImageByPathResult } from "@ext/markdown/elements/image/export/NextImageProcessor";

export const getImageByPath = (options: GetImageByPathOptions): Promise<GetImageByPathResult> => {
	return BrowserImageProccessor.getImageByPath(options);
};
