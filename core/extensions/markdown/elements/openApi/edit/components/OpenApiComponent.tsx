import BlockActionPanel from "@components/BlockActionPanel";
import useWatch from "@core-ui/hooks/useWatch";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import buildNavigationFromSpec from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import { useOpenApiTocItemsStore } from "@ext/markdown/elements/openApi/edit/logic/OpenApiTocItemsStore.provider";
import OpenApi, { type CreateOnComplete } from "@ext/markdown/elements/openApi/render/OpenApi";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import type { NodeViewProps } from "@tiptap/react";
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
		const tocItems = getTocItems(getLevelTocItemsByJSONContent(editor.state.doc, openApiTocItemsData));
		if (tocItems) updateArticleProps({ tocItems: [...tocItems] });
	}, [updateArticleProps, openApiTocItemsData, editor.state.doc]);

	useWatch(() => {
		if (isFirstRender.current || !openApiTocItemsData) {
			isFirstRender.current = false;
			return;
		}

		updateTocItems();
	}, [openApiTocItemsData?.[node.attrs.src]]);

	const createOnComplete: CreateOnComplete = useCallback(
		(src) => (system) => {
			if (!setTocItemsData) return;
			const spec = system.specSelectors.specJson().toJS();
			const navigation = buildNavigationFromSpec(spec);
			setTocItemsData(src, navigation);
		},
		[setTocItemsData],
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
				<OpenApi {...node.attrs} commentId={node.attrs.comment?.id} createOnComplete={createOnComplete} />
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default OpenApiComponent;
