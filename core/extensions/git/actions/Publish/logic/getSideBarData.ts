import { JSONContent } from "@tiptap/core";
import DiffItem from "../../../../VersionControl/model/DiffItem";
import DiffResource from "../../../../VersionControl/model/DiffResource";
import SideBarData from "../model/SideBarData";
import SideBarResourceData from "../model/SideBarResourceData";

const getSideBarData = (
	diffFiles: (DiffItem | DiffResource)[],
	isChecked: boolean,
	isResource: boolean,
): SideBarData[] => {
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
						.map(({ title, diff, filePath, changeType, parentPath }) => {
							return {
								parentPath,
								isResource: true,
								data: {
									changeType,
									filePath,
									title,
								},
								diff,
							};
						})
				: [];
		}

		let parentPath: string;
		let newEditTree: JSONContent;
		let oldEditTree: JSONContent;
		if (isResource) parentPath = (diffFile as DiffResource).parentPath;
		else {
			newEditTree = (diffFile as DiffItem).newEditTree;
			oldEditTree = (diffFile as DiffItem).oldEditTree;
		}

		sideBarData.push({
			parentPath,
			isResource,
			data: {
				title,
				filePath,
				isChanged,
				logicPath,
				resources,
				changeType,
				isChecked,
				newEditTree,
				oldEditTree,
				oldContent: diffFile.oldContent,
				content: diffFile.content,
			},
			diff: diffFile.diff,
		});
	});

	return sideBarData;
};

export default getSideBarData;
