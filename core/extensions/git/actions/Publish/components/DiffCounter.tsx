import styled from "@emotion/styled";

const DiffCounter = styled(({ added, removed, className }: { added: number; removed: number; className?: string }) => {
	return (
		<span className={className + " diff-counter"}>
			{removed === undefined ? null : <span className="removed-counter">-{removed}</span>}
			{added === undefined ? null : <span className="added-counter"> +{added}</span>}
		</span>
	);
})`
	white-space: nowrap;
	font-size: 13px;
	font-weight: 300;

	.removed-counter {
		color: var(--color-removed-text);
	}

	.added-counter {
		color: var(--color-added-text);
	}
`;

export default DiffCounter;
