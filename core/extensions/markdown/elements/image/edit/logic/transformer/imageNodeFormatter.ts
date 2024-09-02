import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { format } from "@ext/markdown/elements/image/render/logic/imageTransformer";
const CLEAR_CROP = { x: 0, y: 0, w: 100, h: 100 };

const imageNodeTransformer: NodeSerializerSpec = (state, node) => {
	const str = format(node.attrs?.crop ?? CLEAR_CROP, node.attrs?.objects ?? [], node.attrs?.scale);
	const newFormat =
		(node.attrs?.crop &&
			typeof node.attrs.crop !== "string" &&
			(node.attrs.crop.w !== 100 || node.attrs.crop.h !== 100)) ||
		node.attrs?.objects?.length > 0 ||
		node.attrs?.scale;

	state.write(
		newFormat
			? "[image:" +
					node.attrs.src +
					":" +
					(node.attrs?.alt ?? "") +
					":" +
					(node.attrs?.title ?? "") +
					":" +
					str +
					"]"
			: "![" +
					state.esc(node.attrs.alt || "") +
					"](" +
					(node.attrs.src?.includes?.(" ") ? `<${node.attrs.src}>` : node.attrs.src) +
					(node.attrs.title ? ' "' + node.attrs.title.replace(/"/g, '\\"') + '"' : "") +
					")\n",
	);
	state.closeBlock(node);
};

export default imageNodeTransformer;
