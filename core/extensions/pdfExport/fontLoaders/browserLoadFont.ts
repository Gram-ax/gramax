import { getConfig } from "@app/config/AppConfig";
import PathUtils from "path";

export const browserLoadFont = async (fontPath: string): Promise<ArrayBuffer> => {
	try {
		const basePath = getConfig().paths.base.value;
		const finalBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
		const response = await fetch(`${finalBasePath}/fonts/${fontPath}`);
		return await response.arrayBuffer();
	} catch (error) {
		console.error(`Error loading font ${fontPath}:`, error);
	}
};
