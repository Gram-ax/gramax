import { uniqueName } from "@core/utils/uniqueName";

const fileNameUtils = {
	getNewName: (names: string[], baseFileName: string, extension: string): string => {
		return uniqueName("./" + baseFileName, names, "." + extension);
	},
};

export default fileNameUtils;
