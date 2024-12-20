import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const file: NotionNodeConverter = async (mediaNode, ctx) => {
	const { type } = mediaNode;
	const fileData = mediaNode?.[type];
	const fileLink = fileData?.url || fileData?.[fileData?.type]?.url;
	const text = fileData?.caption?.[0]?.text?.content || " ";

	const attrs = {
		href: "",
		resourcePath: "",
		hash: "",
		isFile: true,
	};

	let resourceName = { newName: "", title: "file" };

	if (fileData?.type === "external") {
		if (!fileLink) return ctx.convertUnsupported(mediaNode);
		attrs.href = fileLink;
		attrs.isFile = false;
		resourceName.title = new URL(fileLink).pathname.split("/").pop();
	} else {
		resourceName = await ctx.save(fileLink);
		if (!resourceName) return ctx.convertUnsupported(mediaNode);

		attrs.resourcePath = resourceName.newName;
	}

	const textNode = {
		type: "text",
		marks: [{ type: attrs.isFile ? "file" : "link", attrs }],
		text: (fileData.name || resourceName.title) + " ",
	};

	return mediaNode.inline
		? textNode
		: {
				type: "paragraph",
				content: [textNode, { type: "text", text }],
		  };
};

export default file;
