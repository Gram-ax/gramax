import SideBarData from "../model/SideBarData";

const getAllFilePaths = (sideBarData: SideBarData[], includeRenames = true): string[] => {
	if (!sideBarData) return [];
	const filePaths: string[] = [];
	sideBarData
		.filter((x) => x)
		.forEach(({ data }) => {
			if (!data.isChecked) return;
			filePaths.push(data.filePath.path, includeRenames ? data.filePath.oldPath : null);
			data.resources.forEach((resource) => {
				filePaths.push(resource.data.filePath.path, includeRenames ? resource.data.filePath.oldPath : null);
			});
		});
	return filePaths.filter((x) => x);
};

export default getAllFilePaths;
