import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";

export interface SideBarElementData {
	idx: number;
	sideBarDataElement: SideBarResourceData | SideBarData;
	relativeIdx?: number;
	parent?: SideBarData;
}

const getSideBarElementByModelIdx = (idx: number, sideBarData: SideBarData[]): SideBarElementData => {
	if (!sideBarData.length) {
		return { idx: -1, sideBarDataElement: undefined };
	}

	const flattenedData: SideBarElementData[] = sideBarData.flatMap((item): SideBarElementData[] => [
		{ idx: undefined, sideBarDataElement: item },
		...(item?.data.resources ?? []).map(
			(resource, idx): SideBarElementData => ({
				idx: undefined,
				relativeIdx: idx,
				parent: item,
				sideBarDataElement: resource,
			}),
		),
	]);

	for (let i = idx; i >= 0; i--) {
		const data = flattenedData[i];
		if (!data) continue;
		return {
			idx: i,
			sideBarDataElement: data.sideBarDataElement,
			parent: data.parent,
			relativeIdx: data.relativeIdx,
		};
	}

	return { idx: -1, sideBarDataElement: undefined };
};

export default getSideBarElementByModelIdx;
