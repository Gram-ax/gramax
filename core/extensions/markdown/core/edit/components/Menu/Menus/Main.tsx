import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { Editor } from "@tiptap/core";
import { memo } from "react";
import AnyMenuGroup from "../Groups/Any";
import HeadersMenuGroup from "../Groups/Headers";
import ListMenuGroup from "../Groups/List";
import TextMenuGroup from "../Groups/Text";
import AIGroup from "@ext/markdown/core/edit/components/Menu/Groups/AIGroup";
import PropertyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Property";
import TranscribeButton from "@ext/ai/components/Audio/Buttons/TranscribeMenuButton";
import ToolbarWrapper from "@ext/markdown/core/edit/components/Menu/ToolbarWrapper";

export interface MainMenuOptions {
	includeResources?: boolean;
	isGramaxAiEnabled?: boolean;
	isTemplate?: boolean;
	fileName?: string;
	isSmallEditor?: boolean;
}

interface MainMenuProps extends MainMenuOptions {
	editor?: Editor;
}

const MainMenu = (props: MainMenuProps) => {
	const { editor, includeResources = true, isGramaxAiEnabled, isTemplate, fileName, isSmallEditor = false } = props;

	return (
		<ToolbarWrapper>
			<ModalLayoutDark>
				<ButtonsLayout>
					<HeadersMenuGroup editor={editor} />
					<div className="divider" />
					<TextMenuGroup editor={editor} />
					{isTemplate && (
						<>
							<div className="divider" />
							<PropertyMenuGroup editor={editor} />
						</>
					)}
					<div className="divider" />
					<ListMenuGroup editor={editor} />
					<div className="divider" />
					<AnyMenuGroup
						editor={editor}
						includeResources={includeResources}
						fileName={fileName}
						isSmallEditor={isSmallEditor}
					/>
					<div className="divider" />
					<TranscribeButton editor={editor} />
					{isGramaxAiEnabled && <AIGroup editor={editor} />}
				</ButtonsLayout>
			</ModalLayoutDark>
		</ToolbarWrapper>
	);
};
export default memo(MainMenu);
