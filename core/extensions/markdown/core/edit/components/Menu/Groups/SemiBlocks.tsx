import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import BlockquoteMenuButton from "@ext/markdown/elements/blockquote/components/BlockquoteMenuButton";
import CutMenuButton from "@ext/markdown/elements/cut/edit/components/CutMenuButton";
import SnippetsButton from "@ext/markdown/elements/snippet/edit/components/SnippetsButton";
import TabsMenuButton from "@ext/markdown/elements/tabs/edit/components/TabsMenuButton";
import { Editor } from "@tiptap/core";

import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";

const SemiBlocks = ({ editor }: { editor?: Editor }) => {
	const blockquote = ButtonStateService.useCurrentAction({ action: "blockquote" });
	const cut = ButtonStateService.useCurrentAction({ action: "cut" });
	const tabs = ButtonStateService.useCurrentAction({ action: "tabs" });
	const snippet = ButtonStateService.useCurrentAction({ action: "snippet" });

	const isActive = blockquote.isActive || cut.isActive || tabs.isActive || snippet.isActive;
	const disabled = blockquote.disabled && cut.disabled && tabs.disabled && snippet.disabled;

	return (
		<Tooltip
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						<BlockquoteMenuButton editor={editor} />
						<CutMenuButton editor={editor} />
						<TabsMenuButton editor={editor} />
						<SnippetsButton editor={editor} />
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<Button isActive={isActive} disabled={disabled} icon="pencil-ruler" />
		</Tooltip>
	);
};

export default SemiBlocks;
