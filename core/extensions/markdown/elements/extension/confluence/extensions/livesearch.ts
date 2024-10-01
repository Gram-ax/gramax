import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const livesearch: NodeConverter = (_, ctx) => {
	const link = `${ctx.data.domain}/wiki/search`;
	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				text: link,
				marks: [
					{
						type: "link",
						attrs: { href: link, resourcePath: "", hash: "", isFile: false },
					},
				],
			},
		],
	};
};
export default livesearch;
