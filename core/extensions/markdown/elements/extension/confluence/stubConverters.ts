import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const media: NodeConverter = (node) => node;
const caption: NodeConverter = (node) => node;
const code_block: NodeConverter = (node) => node;
const note: NodeConverter = (node) => node;
const inline_external_image: NodeConverter = () => {
	return {
		type: "paragraph",
	};
};

const stubConverters: Record<string, NodeConverter> = {
	media,
	caption,
	code_block,
	note,
	"inline-external-image": inline_external_image,
};

export default stubConverters;
