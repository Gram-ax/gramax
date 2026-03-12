import type {
	DiffFlattenTreeAnyItem,
	DiffFlattenTreeResourceType,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type SideBarData from "../model/SideBarData";
import type SideBarResourceData from "../model/SideBarResourceData";

const getSideBarData = (
	diffFiles: DiffFlattenTreeAnyItem[],
	isChecked: boolean,
	isResource: boolean,
): SideBarData[] => {
	const sideBarData: SideBarData[] = [];
	diffFiles.map((diffFile) => {
		if (diffFile.type === "node") return;
		const title = diffFile.name;
		const filePath = diffFile.filepath.new;
		const isChanged = diffFile.isChanged;
		const status = diffFile.overview.status;
		let logicPath: string;
		let resources: SideBarResourceData[] = [];
		if (diffFile.type === "item") {
			logicPath = diffFile.logicpath;
			resources = diffFile.resources
				? diffFile.resources
						.filter((x) => x)
						.map(({ title, filePath, status, parentPath }): SideBarResourceData => {
							return {
								parentPath,
								isResource: true,
								data: {
									status,
									filePath,
									title,
								},
							};
						})
				: [];
		}

		sideBarData.push({
			parentPath: isResource ? (diffFile as DiffFlattenTreeResourceType).parentPath : undefined,
			isResource,
			data: {
				title,
				filePath: {
					path: filePath,
					oldPath: diffFile.filepath.old,
				},
				isChanged,
				logicPath,
				resources,
				status,
				isChecked,
				added: diffFile.overview.added,
				deleted: diffFile.overview.removed,
			},
		});
	});

	return sideBarData;
};

export default getSideBarData;
