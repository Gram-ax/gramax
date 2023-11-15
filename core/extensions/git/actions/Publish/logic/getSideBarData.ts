import DiffItem from "../../../../VersionControl/model/DiffItem";
import DiffResource from "../../../../VersionControl/model/DiffResource";
import SideBarData from "../model/SideBarData";
import SideBarResourceData from "../model/SideBarResourceData";

const getSideBarData = (diffFiles: (DiffItem | DiffResource)[], isChecked: boolean): SideBarData[] => {
	const sideBarData: SideBarData[] = [];
	diffFiles.map((diffFile) => {
		const { title, filePath, isChanged, changeType } = diffFile;
		let logicPath: string;
		let resources: SideBarResourceData[] = [];
		if (diffFile.type === "item") {
			logicPath = diffFile.logicPath;
			resources = diffFile.resources
				? diffFile.resources
						.filter((x) => x)
						.map(({ title, diff, filePath }) => {
							return {
								filePath,
								title,
								diff,
							};
						})
				: [];
		}

		sideBarData.push({
			data: {
				title,
				filePath,
				isChanged,
				logicPath,
				resources,
				changeType,
				isChecked,
			},
			diff: diffFile.diff,
		});
	});

	return sideBarData;
};

export default getSideBarData;
