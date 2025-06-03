import Tooltip from "@components/Atoms/Tooltip";
import useIsOverflow from "@core-ui/hooks/useIsOverflow";
import styled from "@emotion/styled";
import type { DiffTreeBreadcrumb } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { useRef } from "react";

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
	const wrapperRef = useRef<HTMLDivElement>(null);
	const isOverflow = useIsOverflow(wrapperRef);

	if (!breadcrumb.length) return null;
	const breadcrumbString = breadcrumb.map((b) => b.name).join("/");

	return (
		<Wrapper marginLeft={marginLeft}>
			<Tooltip interactive content={breadcrumbString} disabled={!isOverflow}>
				<div ref={wrapperRef}>
					{breadcrumb.map((b, id) => (
						<span key={id}>{b.name}</span>
					))}
				</div>
			</Tooltip>
		</Wrapper>
	);
};

export default Breadcrumbs;
