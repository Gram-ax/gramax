import type { DiffFilePaths, DiffItem, DiffResource } from "@ext/VersionControl/model/Diff";
import { JSONContent } from "@tiptap/core";
import SideBarData from "../model/SideBarData";
import SideBarResourceData from "../model/SideBarResourceData";

const getSideBarData = (
	diffFiles: (DiffItem | DiffResource)[],
	isChecked: boolean,
	isResource: boolean,
): SideBarData[] => {
	const sideBarData: SideBarData[] = [];
	diffFiles.map((diffFile) => {
		const { title, filePath, isChanged, status } = diffFile;
		let logicPath: string;
		let resources: SideBarResourceData[] = [];
		if (diffFile.type === "item") {
			logicPath = diffFile.logicPath;
			resources = diffFile.resources
				? diffFile.resources
						.filter((x) => x)
						.map(
							({
								title,
								filePath,
								hunks,
								status,
								parentPath,
								content,
								oldContent,
							}): SideBarResourceData => {
								return {
									parentPath,
									isResource: true,
									data: {
										status,
										filePath,
										title,
										content,
										oldContent,
									},
									hunks,
								};
							},
						)
				: [];
		}

		let parentPath: DiffFilePaths;
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
				status,
				isChecked,
				newEditTree,
				oldEditTree,
				oldContent: diffFile.oldContent,
				content: diffFile.content,
				added: diffFile.added,
				deleted: diffFile.deleted,
			},
			hunks: diffFile.hunks,
		});
	});

	return sideBarData;
};

export default getSideBarData;
