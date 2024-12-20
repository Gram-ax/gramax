import styled from "@emotion/styled";

const ArticleExtensions = ({ className, id }: { id: string; className?: string }) => {
	return (
		<div className={className}>
			<div id={id} />
		</div>
	);
};

export default styled(ArticleExtensions)`
	bottom: 4px;
	z-index: var(--z-index-base);
	position: sticky;
`;
