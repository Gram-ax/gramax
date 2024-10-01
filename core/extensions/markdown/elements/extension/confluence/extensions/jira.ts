import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";

const jira: NodeConverter = (jiraNode, ctx) => {
	const jqlQuery = jiraNode?.attrs?.parameters?.macroParams?.jqlQuery?.value;
	if (jqlQuery) {
		const link = `${ctx.data.domain}/issues/?jql=${encodeURIComponent(jqlQuery)}`;
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
	}
	return convertUnsupportedNode(jiraNode, ctx.confluencePageUrl);
};

export default jira;
