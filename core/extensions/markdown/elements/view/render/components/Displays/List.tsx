import styled from "@emotion/styled";
import renderGroup from "@ext/markdown/elements/view/render/components/Displays/Helpers/List/Group";
import { ViewRenderGroup } from "@ext/properties/models";
import { Fragment, ReactNode } from "react";

const List = ({ content, className }: { content: ViewRenderGroup[]; className?: string }): ReactNode => {
	if (!content.length) return null;

	return (
		<ul className={className} data-focusable="true">
			{content.map((group: ViewRenderGroup) => (
				<Fragment key={group.group?.[0]}>{renderGroup(group)}</Fragment>
			))}
		</ul>
	);
};

export default styled(List)`
	border-radius: var(--radius-small);

	a {
		cursor: pointer !important;
	}

	li > div {
		gap: 0.5em;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		word-wrap: break-word;
		flex-direction: row;

		.chips {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			word-wrap: break-word;
			gap: 0.5em;
			font-size: 0.65em;

			* {
				line-height: normal !important;
			}
		}
	}
`;
