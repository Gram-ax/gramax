import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import attachmentLink from "@ext/confluence/core/server/logic/HTMLElements/attachmentLink";
import image from "@ext/confluence/core/server/logic/HTMLElements/image";
import pageLink from "@ext/confluence/core/server/logic/HTMLElements/pageLink";
import user from "@ext/confluence/core/server/logic/HTMLElements/user";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const link: HTMLNodeConverter = async (linkNode, ctx) => {
	const riTypes = {
		attachment: attachmentLink,
		user: user,
		page: pageLink,
	};

	const imageNode = linkNode.querySelector("ac\\:image");
	if (imageNode) {
		const attachmentNode = imageNode.querySelector("ri\\:attachment");
		if (attachmentNode) {
			return await image(imageNode as HTMLElement, ctx);
		}
	}

	const foundRi = Object.keys(riTypes).find((ri) => linkNode.querySelector(`ri\\:${ri}`));
	if (foundRi) {
		return await riTypes[foundRi](linkNode, ctx);
	}

	return convertHTMLUnsupportedNode(linkNode, ctx.confluencePageUrl);
};

export default link;
