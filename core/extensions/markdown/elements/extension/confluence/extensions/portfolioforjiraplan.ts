import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const portfolioforjiraplan: NodeConverter = (portfolioforjiraplanNode) => {
	const link = portfolioforjiraplanNode.attrs?.parameters?.macroParams?.url?.value;
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
export default portfolioforjiraplan;
