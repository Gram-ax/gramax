import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";

const getSideBarElementByModelIdx = (
	idx: number,
	sideBarData: SideBarData[],
): { idx: number; sideBarDataElement: SideBarData | SideBarResourceData } => {
	if (!sideBarData.length) {
		return { idx: -1, sideBarDataElement: undefined };
	}

	const flattenedData = sideBarData.flatMap((item) => [item, ...(item?.data.resources ?? [])]);

	for (let i = idx; i >= 0; i--) {
		const sideBarElement = flattenedData[i];
		if (!sideBarElement) continue;
		return { idx: i, sideBarDataElement: sideBarElement };
	}

	return { idx: -1, sideBarDataElement: undefined };
};

export default getSideBarElementByModelIdx;
