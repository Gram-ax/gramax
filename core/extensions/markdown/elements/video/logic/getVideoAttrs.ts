import linkCreator from "../../link/render/logic/linkCreator";

const getVideoAttrs = (attrs: { [key: string]: string }) => {
	const path = attrs.path;
	let isLink = true;
	if (!linkCreator.isExternalLink(path)) isLink = false;
	if (!path) isLink = true;

	return { title: attrs.title ?? null, path, isLink };
};

export default getVideoAttrs;
