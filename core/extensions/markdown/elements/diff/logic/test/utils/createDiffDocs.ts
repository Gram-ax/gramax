import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import DocCreator from "@ext/markdown/elements/diff/logic/test/utils/DocCreator";
import { Node } from "prosemirror-model";

const schema = getSchema();

function createDiffDocs(createSteps: (doc: DocCreator) => DocCreator, transformSteps: (doc: DocCreator) => DocCreator) {
	const oldDoc = Node.fromJSON(schema, {
		type: "doc",
		content: createSteps(DocCreator.create()).value(),
	});

	const newDoc = Node.fromJSON(schema, {
		type: "doc",
		content: transformSteps(createSteps(DocCreator.create())).value(),
	});

	return { oldDoc, newDoc };
}

export default createDiffDocs;
