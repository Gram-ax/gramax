const getAttrs = (attrs: Record<string, string>) => {
	const titleIsWidth = attrs?.title?.includes("px");
	const title = titleIsWidth ? "" : attrs?.title;
	const src = attrs?.path ?? "";
	const width = titleIsWidth ? attrs?.title : attrs?.width;
	const height = titleIsWidth ? attrs?.width : attrs?.height;
	const float = width && height ? attrs?.float : attrs?.title;
	const scaleRaw = attrs?.scale;
	const scale = scaleRaw ? (scaleRaw.endsWith("px") ? scaleRaw : +scaleRaw) : undefined;

	return { src, title, width, height, float, scale };
};

export default getAttrs;
