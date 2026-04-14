import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

interface LinkTooltipSizeState {
	width: number;
	height: number;
	setWidth: (width: number) => void;
	setHeight: (height: number) => void;
}

const linkTooltipSizeStore = create<LinkTooltipSizeState>()(
	persist(
		(set) => ({
			width: 0,
			height: 0,
			setWidth: (width: number) =>
				set(() => {
					return { width };
				}),
			setHeight: (height: number) =>
				set(() => {
					return { height };
				}),
		}),
		{
			name: "link-tooltip-size",
			version: 1,
		},
	),
);

export const useTooltipSize = () =>
	useStoreWithEqualityFn(linkTooltipSizeStore, (state) => ({ width: state.width, height: state.height }), shallow);

export const setLinkTooltipWidth = (width: number) => linkTooltipSizeStore.getState().setWidth(width);

export const setLinkTooltipHeight = (height: number) => linkTooltipSizeStore.getState().setHeight(height);
