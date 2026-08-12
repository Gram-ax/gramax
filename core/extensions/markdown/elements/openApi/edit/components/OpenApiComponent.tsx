import BlockActionPanel from "@components/BlockActionPanel";
import useWatch from "@core-ui/hooks/useWatch";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import buildNavigationFromSpec from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import { createOpenApiTocItemsResolver } from "@ext/markdown/elements/openApi/edit/logic/OpenApiTocItemsStore";
import { useOpenApiTocItemsStore } from "@ext/markdown/elements/openApi/edit/logic/OpenApiTocItemsStore.provider";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import type { NodeViewProps } from "@tiptap/react";
import * as yaml from "js-yaml";
import { type ReactElement, useCallback, useRef } from "react";

const OpenApiComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;
	const isFirstRender = useRef(true);

	const updateArticleProps = useArticlePropsStore((state) => state.update);
	const { openApiTocItemsData, setTocItemsData } = useOpenApiTocItemsStore((store) => ({
		openApiTocItemsData: store.data,
		setTocItemsData: store.setTocItemsData,
	}));

	const updateTocItems = useCallback(() => {
		const tocItems = getTocItems(
			getLevelTocItemsByJSONContent(editor.state.doc, createOpenApiTocItemsResolver(openApiTocItemsData)),
		);
		if (tocItems) updateArticleProps({ tocItems: [...tocItems] });
	}, [updateArticleProps, openApiTocItemsData, editor.state.doc]);

	useWatch(() => {
		if (isFirstRender.current || !openApiTocItemsData) {
			isFirstRender.current = false;
			return;
		}

		updateTocItems();
	}, [openApiTocItemsData?.[node.attrs.src]]);

	const handleSpecLoaded = useCallback(
		(spec: string | null) => {
			if (!setTocItemsData) return;
			// null arrives on every load failure. The navigation lives in the store by src and survives a
			// failed reload, so it has to be cleared explicitly -- otherwise the article's table of contents
			// keeps pointing at operations that are no longer on screen.
			if (spec === null) {
				setTocItemsData(node.attrs.src, []);
				return;
			}
			try {
				const json = yaml.load(spec);
				const navigation = buildNavigationFromSpec(json);
				setTocItemsData(node.attrs.src, navigation);
			} catch {
				return;
			}
		},
		[setTocItemsData, node.attrs.src],
	);

	return (
		<NodeViewContextableWrapper data-drag-handle draggable={true} props={props} ref={hoverElement}>
			<BlockActionPanel
				actionsOptions={{ comment: true }}
				getPos={getPos}
				hoverElementRef={hoverElement}
				rightActions={
					isEditable && <OpenApiActions editor={editor} node={node} updateAttributes={updateAttributes} />
				}
				selected={false}
				updateAttributes={updateAttributes}
			>
				<OpenApi
					{...node.attrs}
					commentId={node.attrs.comment?.id}
					isEditing={editor.isEditable}
					onSpecLoaded={handleSpecLoaded}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default OpenApiComponent;
