const fileNameUtils = {
	getNewName: (names: string[], baseFileName: string, extension: string, setZeroIndex = true): string => {
		const newImageName = "./" + baseFileName;
		let newName = "";
		let nameIsExist = false;
		let idx = 0;
		do {
			if (!setZeroIndex && idx == 0) newName = `${newImageName}.${extension}`;
			else newName = `${newImageName}_${idx}.${extension}`;
			nameIsExist = fileNameUtils.nameIsExist(newName, names);
			idx++;
		} while (nameIsExist);

		return newName;
	},

	nameIsExist(baseName: string, names: string[]) {
		const index = names.findIndex((name) => name == baseName);
		return index !== -1;
	},
};

export default fileNameUtils;
