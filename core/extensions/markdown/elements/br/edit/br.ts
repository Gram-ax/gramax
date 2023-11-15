import br from "@ext/markdown/elements/br/edit/model/brSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Node } from "@tiptap/core";

interface BrOptions {
	keepMarks: boolean;
	HTMLAttributes: Record<string, any>;
}

const Br = Node.create<BrOptions>({
	...getExtensionOptions({ schema: br, name: "br" }),

	renderHTML() {
		return ["br"];
	},
});

export default Br;
