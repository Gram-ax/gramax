import { UNIQUE_NAME_SEPARATOR } from "@app/config/const";
import { uniqueName } from "@core/utils/uniqueName";

const fileNameUtils = {
	getNewName: (names: string[], baseFileName: string, extension: string): string => {
		const normalizedExtension = extension ? extension.toLowerCase() : "";
		const newExtension = normalizedExtension ? "." + normalizedExtension : "";
		const normalizedNames = names.map((name) => name.toLowerCase());
		baseFileName = normalizedNames.includes(("./" + baseFileName + newExtension).toLowerCase())
			? fileNameUtils.removeIndex(baseFileName)
			: baseFileName;

		return uniqueName("./" + baseFileName, names, newExtension, UNIQUE_NAME_SEPARATOR, true);
	},
	removeIndex: (name: string): string => {
		return name.replace(/-\d+$/, "");
	},
};

export default fileNameUtils;
