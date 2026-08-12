import linkCreator from "../../link/render/logic/linkCreator";

const getVideoAttrs = (attrs: { [key: string]: string }) => {
	const path = attrs.path;
	let isLink = true;
	if (!linkCreator.isExternalLink(path)) isLink = false;
	if (!path) isLink = true;

	return { title: attrs.title ?? null, path, isLink, scale: attrs.scale ?? null };
};

export default getVideoAttrs;
