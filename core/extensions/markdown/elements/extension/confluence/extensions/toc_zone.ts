import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const toc_zone: NodeConverter = (toc_zoneNode) => {
	return {
		type: "paragraph",
		content: toc_zoneNode.content,
	};
};

export default toc_zone;
