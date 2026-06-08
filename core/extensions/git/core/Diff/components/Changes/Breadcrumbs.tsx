import styled from "@emotion/styled";
import type { DiffTreeBreadcrumb } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const Wrapper = styled.div<{ marginLeft?: number }>`
	> div {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	line-height: 12px;

	margin: 0.2em 0;
	margin-left: ${({ marginLeft }) => (marginLeft || 0) * 1.05 + 0.15}rem;

	> div > span:after {
		content: "/";
		margin: 0.2em;
	}
`;

const Breadcrumbs = ({ breadcrumb, marginLeft }: { breadcrumb: DiffTreeBreadcrumb[]; marginLeft?: number }) => {
	if (!breadcrumb.length) return null;
	const breadcrumbString = breadcrumb.map((b) => b.name).join("/");

	return (
		<Wrapper marginLeft={marginLeft}>
			<TextOverflowTooltip className="truncate">{breadcrumbString}</TextOverflowTooltip>
		</Wrapper>
	);
};

export default Breadcrumbs;
