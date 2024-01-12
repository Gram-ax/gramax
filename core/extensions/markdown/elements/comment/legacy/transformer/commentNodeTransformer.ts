import CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";
import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";
import { transformNodeToModel } from "./Transformer";

const commentNodeTransformer: NodeTransformerFunc = async (node, previousNode, nextNode, context, count) => {
	if (node?.type == "comment_old") return { isSet: true, value: null };
	if (nextNode?.type !== "comment_old") return;
	const commentBlock = await transformNodeToModel(nextNode, context);
	const commentProvider = new CommentProvider(context.fp, context.getArticle().ref.path);

	let isSet = false;
	const findText = async (node) => {
		if (isSet) return;
		for (const n of node.content) {
			if (n.type == "text") {
				await commentProvider.saveComment(count.toString(), commentBlock, context);
				const rm = context.getResourceManager();
				rm.set(rm.rootPath.join(rm.basePath).getRelativePath(commentProvider.getFilePath()));
				n.marks = [...(n.marks ?? []), { type: "comment", attrs: { count, ...commentBlock } }];
				isSet = true;
				return;
			}
			if (n.content) await findText(n);
		}
	};

	await findText(node);

	return { isSet: true, value: node };
};

export default commentNodeTransformer;
