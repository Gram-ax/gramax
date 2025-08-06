import InlineMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Inline";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import TableMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Table";
import TableAggregation from "@ext/markdown/core/edit/components/Menu/Groups/TableAggregation";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import { PanelMenuComponentProps } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";

const MainPanel = (props: PanelMenuComponentProps) => {
	const { editor, closeHandler, inTable, isCellSelection, setPanel, isGramaxAiEnabled } = props;

	return (
		<>
			{inTable && (
				<>
					<TableMenuGroup editor={editor} onClick={closeHandler} />
					<TableAggregation editor={editor} disabled={!isCellSelection} />
					<div className="divider" />
				</>
			)}
			<TextMenuGroup editor={editor} isSelectionMenu />
			<div className="divider" />
			<ListMenuGroup editor={editor} />
			{!isCellSelection && (
				<>
					<div className="divider" />
					<InlineMenuGroup
						editor={editor}
						onClick={closeHandler}
						isGramaxAiEnabled={isGramaxAiEnabled}
						setPanel={setPanel}
					/>
				</>
			)}
		</>
	);
};

export default MainPanel;
