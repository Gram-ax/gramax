import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/core";
import { memo } from "react";
import AnyMenuGroup from "../Groups/Any";
import HeadersMenuGroup from "../Groups/Headers";
import ListMenuGroup from "../Groups/List";
import TextMenuGroup from "../Groups/Text";
import AIGroup from "@ext/markdown/core/edit/components/Menu/Groups/AIGroup";
import PropertyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Property";

export interface MainMenuOptions {
	includeResources?: boolean;
	isGramaxAiEnabled?: boolean;
	isTemplate?: boolean;
	fileName?: string;
	isSmallEditor?: boolean;
}

interface MainMenuProps extends MainMenuOptions {
	editor?: Editor;
	className?: string;
}

const MainMenu = styled(
	({
		editor,
		className,
		includeResources = true,
		isGramaxAiEnabled,
		isTemplate,
		fileName,
		isSmallEditor = false,
	}: MainMenuProps) => {
		return (
			<div className={className}>
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
						{isGramaxAiEnabled && (
							<>
								<div className="divider" />
								<AIGroup editor={editor} />
							</>
						)}
					</ButtonsLayout>
				</ModalLayoutDark>
			</div>
		);
	},
)`
	border-radius: var(--radius-large);

	> div > div {
		flex-wrap: wrap;
	}

	pointer-events: auto;

	@media only screen and (max-width: 1163px) {
		.hidden {
			display: none;
		}

		> div > div {
			max-width: 331px;
		}
	}

	${cssMedia.medium} {
		.hidden {
			display: block;
		}

		> div > div {
			max-width: fit-content;
		}
	}

	${cssMedia.narrow} {
		max-width: fit-content;

		> div > div {
			flex-wrap: nowrap;
			max-width: 95vw;
			overflow: scroll;
		}
	}
`;
export default memo(MainMenu);
