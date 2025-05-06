import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import HeadersMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Headers";
import { Editor } from "@tiptap/core";
import { memo } from "react";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import PropertyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Property";
import AnyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Any";

const TemplateMenu = styled(({ editor, className }: { editor?: Editor; className?: string }) => {
	return (
		<div className={className}>
			<ModalLayoutDark>
				<ButtonsLayout>
					<HeadersMenuGroup editor={editor} />
					<div className="divider" />
					<TextMenuGroup editor={editor} />
					<div className="divider" />
					<PropertyMenuGroup editor={editor} />
					<div className="divider" />
					<ListMenuGroup editor={editor} />
					<div className="divider" />
					<AnyMenuGroup editor={editor} includeResources={false} />
				</ButtonsLayout>
			</ModalLayoutDark>
		</div>
	);
})`
	border-radius: var(--radius-large);

	pointer-events: auto;

	> div > div {
		flex-wrap: wrap;
	}

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

export default memo(TemplateMenu);
