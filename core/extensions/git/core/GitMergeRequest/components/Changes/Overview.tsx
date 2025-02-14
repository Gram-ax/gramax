import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { DiffItemOrResource, DiffItemResourceCollection } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useMemo } from "react";

export type OverviewProps = {
	showTotal?: boolean;
	showZeroes?: boolean;
	deleted?: number;
	modified?: number;
	added?: number;
	fontSize?: string;
};

export const useTotalOverviewCount = (changes: DiffItemResourceCollection) => {
	return useMemo(() => {
		const init: OverviewProps = { deleted: 0, modified: 0, added: 0 };

		if (!changes) return init;

		const callback = (prev: OverviewProps, curr: DiffItemOrResource) => {
			if (curr.status === FileStatus.delete) prev.deleted++;
			if (curr.status === FileStatus.modified) prev.modified++;
			if (curr.status === FileStatus.new) prev.added++;
			if (curr.type === "item") curr.resources?.reduce(callback, prev);

			return prev;
		};

		changes.items?.reduce(callback, init);
		changes.resources?.reduce(callback, init);

		return init;
	}, [changes]);
};

const Base = styled.span<{ tint?: boolean; prefix?: string }>`
	${({ tint }) =>
		tint &&
		css`
			color: var(--color-merge-request-text) !important;
		`}
`;

const Added = styled(Base)`
	color: var(--color-status-new);
`;

const Deleted = styled(Base)`
	color: var(--color-status-deleted);
`;

const Modified = styled(Base)`
	color: var(--color-status-modified);
`;

const Wrapper = styled.span<{ showTotal?: boolean; fontSize?: string }>`
	font-size: ${({ fontSize }) => fontSize || "10px"};
	display: flex;
	flex-wrap: nowrap;
	justify-content: center;
	align-items: center;
	font-family: "Roboto Mono";

	span {
		letter-spacing: 0;
		padding: 0;
	}

	> *:not(:last-of-type):after {
		content: "/";
		color: var(--color-merge-request-text);
		opacity: 0.6;
	}

	${({ showTotal }) =>
		showTotal &&
		css`
			> *:first-of-type::after {
				content: "";
				margin-right: 0.5em;
			}
		`}
`;

export const Overview = ({ showTotal, showZeroes = false, deleted, modified, added, fontSize }: OverviewProps) => {
	if (!added && !modified && !deleted) return null;

	const Total = showTotal && <Accent bold>{added + modified + deleted}</Accent>;

	return (
		<Wrapper showTotal={showTotal} fontSize={fontSize}>
			{Total}
			{added > 0 - Number(showZeroes) && <Added tint={added === 0}>+{added}</Added>}
			{modified > 0 - Number(showZeroes) && <Modified tint={modified === 0}>±{modified}</Modified>}
			{deleted > 0 - Number(showZeroes) && <Deleted tint={deleted === 0}>-{deleted}</Deleted>}
		</Wrapper>
	);
};
