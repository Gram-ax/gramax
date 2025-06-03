import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import HTMLMenuButton from "@ext/markdown/elements/html/edit/components/HTMLMenuButton";
import SnippetsButton from "@ext/markdown/elements/snippet/edit/components/SnippetsButton";
import TabsMenuButton from "@ext/markdown/elements/tabs/edit/components/TabsMenuButton";
import ViewMenuButton from "@ext/markdown/elements/view/edit/components/ViewMenuButton";
import { Editor } from "@tiptap/core";
import { useState } from "react";

interface SemiBlocksProps {
	editor?: Editor;
	includeResources?: boolean;
	isSmallEditor?: boolean;
}

const SemiBlocks = ({ editor, includeResources, isSmallEditor }: SemiBlocksProps) => {
	const tabs = ButtonStateService.useCurrentAction({ action: "tabs" });
	const snippet = ButtonStateService.useCurrentAction({ action: "snippet" });

	const syntax = CatalogPropsService.value.syntax;
	const formatterSupportedElements = getFormatterType(syntax).supportedElements;

	const isTabsSupported = formatterSupportedElements.includes("tabs");
	const isSnippetSupported = formatterSupportedElements.includes("snippet");
	const isHtmlSupported = formatterSupportedElements.includes("HTML");
	const isViewSupported = formatterSupportedElements.includes("view");

	if (!isTabsSupported && !isSnippetSupported && !isHtmlSupported && !isViewSupported) {
		return null;
	}

	const isActive = tabs.isActive || snippet.isActive;
	const disabled = tabs.disabled && snippet.disabled;

	const [isOpen, setIsOpen] = useState(false);

	return (
		<Tooltip
			onAfterUpdate={(instance) => {
				if (!isOpen) instance.hide();
			}}
			onShow={() => setIsOpen(true)}
			onHide={() => setIsOpen(false)}
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						{isTabsSupported && <TabsMenuButton editor={editor} />}
						{!isSmallEditor && isSnippetSupported && includeResources && (
							<SnippetsButton editor={editor} onClose={() => setIsOpen(false)} />
						)}
						{isHtmlSupported && <HTMLMenuButton editor={editor} />}
						{!isSmallEditor && isViewSupported && <ViewMenuButton editor={editor} />}
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<Button isActive={isActive} disabled={disabled} icon="pencil-ruler" />
		</Tooltip>
	);
};

export default SemiBlocks;
