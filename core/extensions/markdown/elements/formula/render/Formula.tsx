import styled from "@emotion/styled";

const Formula = styled(({ content, className }: { content: string; className?: string }) => {
	if (!content) return null;
	return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
})`
	display: inline;
`;

export default Formula;
