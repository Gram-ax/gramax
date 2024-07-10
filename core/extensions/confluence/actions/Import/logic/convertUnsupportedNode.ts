import translateConfluenceName from "@ext/confluence/actions/Import/logic/translateConfluenceName";
import { JSONContent } from "@tiptap/core";

const convertUnsupportedNode = (UnsupportedNode: JSONContent, currentPageUrl: string): JSONContent[] => {
	return [
		{ type: "paragraph", content: [{ type: "text", text: " " }] },
		{
			type: "note",
			attrs: {
				type: "note",
				title: `Не удалось импортировать «${translateConfluenceName(UnsupportedNode)}» из Confluence`,
				collapsed: true,
			},
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: `Вы можете перенести его вручную со страницы `,
						},
						{
							type: "text",
							text: currentPageUrl,
							marks: [
								{
									type: "link",
									attrs: {
										href: currentPageUrl || "",
										resourcePath: "",
										hash: "",
										isFile: false,
									},
								},
							],
						},
					],
				},
				{
					type: "code_block",
					attrs: { params: "JSON" },
					content: [{ type: "text", text: "" + JSON.stringify(UnsupportedNode, null, 1) }],
				},
			],
		},
	];
};

export default convertUnsupportedNode;
