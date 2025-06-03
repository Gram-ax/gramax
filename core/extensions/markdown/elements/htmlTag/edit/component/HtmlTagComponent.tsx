import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { JSONContent } from "@tiptap/core";
import { useMemo } from "react";

const HtmlTagComponent = ({ editTree }: { editTree: JSONContent }) => {
	const renderTree = editTreeToRenderTree(editTree, getSchema());
	const content = Renderer(renderTree, { components: useMemo(getComponents, []) });
	return content;
};

export default HtmlTagComponent;
