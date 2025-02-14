import { uniqueName } from "@core/utils/uniqueName";

const fileNameUtils = {
	getNewName: (names: string[], baseFileName: string, extension: string): string => {
		const newExtension = extension ? "." + extension : "";
		baseFileName = names.includes("./" + baseFileName + newExtension)
			? fileNameUtils.removeIndex(baseFileName)
			: baseFileName;
		return uniqueName("./" + baseFileName, names, newExtension);
	},
	removeIndex: (name: string): string => {
		return name.replace(/-\d+$/, "");
	},
};

export default fileNameUtils;
