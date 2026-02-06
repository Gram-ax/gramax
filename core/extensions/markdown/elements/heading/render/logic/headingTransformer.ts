import { Child } from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import { getHeaderTitle } from "@ext/markdown/elements/heading/render/model/heading";
import getChildTextId from "../../logic/getChildTextId";

const headingTransformer = (tag: Child): object | object[] => {
	if (tag.name !== "Heading") return tag;

	const title = getHeaderTitle(tag.children);

	const newTag = {
		...tag,
		attributes: { ...tag.attributes, id: tag.attributes.id ?? getChildTextId(title) },
	};

	return newTag;
};

export default headingTransformer;
