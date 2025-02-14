import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";
import { JSONContent } from "@tiptap/core";

const video: NotionNodeConverter = async (videoNode, ctx) => {
	const fileLink = videoNode?.video[videoNode?.video?.type]?.url;
	const title = videoNode?.video?.caption?.[0]?.text?.content;

	if (videoNode.video.type !== "file")
		return {
			type: "video",
			attrs: {
				title: title,
				path: fileLink,
				isLink: true,
			},
		};

	const resourceName = await ctx.save(fileLink);
	if (!resourceName) return ctx.convertUnsupported(videoNode);

	const content: JSONContent[] = [
		{
			type: "text",
			marks: [
				{
					type: "file",
					attrs: {
						href: "",
						resourcePath: resourceName.newName,
						hash: "",
						isFile: true,
					},
				},
			],
			text: resourceName.title + " ",
		},
	];

	if (title) content.push({ type: "text", text: title });

	return {
		type: "paragraph",
		content,
	};
};

export default video;
