import type { VideoLayout } from "@ext/markdown/elements/video/logic/getVideoLayout";
import { tv } from "tailwind-variants";

const VERTICAL_VIDEO_WIDTH = "w-[min(100%,calc(70vh*9/16))]";

export const getVideoResizerClassName = (layout: VideoLayout) =>
	layout === "vertical" ? VERTICAL_VIDEO_WIDTH : undefined;

export const getVideoAspectRatio = (layout: VideoLayout) => (layout === "vertical" ? "9 / 16" : "16 / 9");

const videoComponentStyles = tv({
	base: [
		"w-full",
		"has-[iframe]:h-full",
		"has-[iframe]:mb-2",
		"has-[iframe]:[&>div]:h-full",
		"[&_.error-text-parent]:overflow-hidden",
		"[&_iframe]:flex",
		"[&_iframe]:h-full",
		"[&_iframe]:w-full",
	],
	variants: {
		layout: {
			horizontal: ["has-[iframe]:aspect-video"],
			vertical: ["has-[iframe]:aspect-[9/16]"],
		},
	},
});

export default videoComponentStyles;
