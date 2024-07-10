import ConfluenceAPI from "@ext/confluence/ConfluenceAPI";
import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";

const profile: NodeConverter = async (profileNode, ctx) => {
    const macroParams = profileNode?.attrs?.parameters?.macroParams;
	const accountId = macroParams?.user?.value || macroParams?.User?.value;
	
    const api = makeSourceApi(ctx.data) as ConfluenceAPI;
	const profile = await api.getUserById(accountId);

	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				text: profile.name,
				marks: [
					{
						type: "link",
						attrs: { href: profile.link, resourcePath: "", hash: "", isFile: false },
					},
				],
			},
		],
	};
};
export default profile;
