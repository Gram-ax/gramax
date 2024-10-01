import SideBarData from "../model/SideBarData";

const deleteSideBarDataItem = (
	sideBarData: SideBarData[],
	paths: string[],
): { sideBarData: SideBarData[]; hasDeleted: boolean } => {
	let hasDeleted = false;
	sideBarData = [...sideBarData];
	const currentDeleteSideBarDataItem = (idx: number) => {
		sideBarData[idx] = undefined;
		hasDeleted = true;
	};

	paths.forEach((path) => {
		sideBarData.forEach((sideBarDataItem, idx) => {
			if (!sideBarDataItem?.data) return;
			if (sideBarDataItem.data.filePath.path === path) currentDeleteSideBarDataItem(idx);
			else {
				const resources = sideBarDataItem.data.resources;
				resources.forEach((resource, resourceIdx) => {
					if (resource.filePath.path === path) {
						resources[resourceIdx] = undefined;
					}
				});
				sideBarDataItem.data.resources = resources.filter((x) => x !== undefined);
			}
		});
	});

	return { sideBarData: sideBarData.filter((x) => x !== undefined), hasDeleted };
};

export default deleteSideBarDataItem;
