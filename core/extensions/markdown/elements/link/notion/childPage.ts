import { transliterate } from "@core-ui/languageConverter/transliterate";
import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const childPage: NotionNodeConverter = (childPageNode) => {
	const title = childPageNode?.[childPageNode.type]?.title || " ";
	
	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				plain_text: title,
				marks: [
					{
						type: "link",
						attrs: {
							href: "",
							resourcePath: `./${transliterate(title, { kebab: true, maxLength: 50 })}.md`,
							hash: "",
							isFile: false,
						},
					},
				],
			},
		],
	};
};

export default childPage;
