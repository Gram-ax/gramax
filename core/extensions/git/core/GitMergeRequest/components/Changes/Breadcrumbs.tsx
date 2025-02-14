import styled from "@emotion/styled";
import type { DiffTreeBreadcrumb } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

const Wrapper = styled.div<{ marginLeft?: number }>`
	display: flex;
	flex-wrap: wrap;
	line-height: 12px;

	margin: 0.2em 0;
	margin-left: ${({ marginLeft }) => (marginLeft || 0) * 1.05 + 0.15}rem;

	> span:after {
		content: "/";
		margin: 0.2em;
	}
`;

const Breadcrumbs = ({ breadcrumb, marginLeft }: { breadcrumb: DiffTreeBreadcrumb[]; marginLeft?: number }) => {
	if (!breadcrumb.length) return null;
  
	return (
		<Wrapper marginLeft={marginLeft}>
			{breadcrumb.map((b, id) => (
				<span key={id}>{b.name}</span>
			))}
		</Wrapper>
	);
};

export default Breadcrumbs;
