import type NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const toc_zone: NodeConverter = (tocZoneNode) => {
	return {
		type: "paragraph",
		content: tocZoneNode.content,
	};
};

export default toc_zone;
