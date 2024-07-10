import { uniqueName } from "@core/utils/uniqueName";

const fileNameUtils = {
	getNewName: (names: string[], baseFileName: string, extension: string): string => {
		baseFileName = names.includes("./" + baseFileName + "." + extension)
			? fileNameUtils.removeIndex(baseFileName)
			: baseFileName;
		return uniqueName("./" + baseFileName, names, "." + extension);
	},
	removeIndex: (name: string): string => {
		return name.replace(/-\d+$/, "");
	},
};

export default fileNameUtils;
