import styled from "@emotion/styled";

const removePTags = (html: string) => {
	const newHtml = html.replace(/<p>(.*?)<\/p>/g, "$1");
	const changed = newHtml !== html;
	return { newContent: newHtml, changed };
};
const Formula = ({ content, className }: { content: string; className: string }) => {
	if (!content) return null;

	const { newContent, changed } = removePTags(content);
	return (
		<span
			className={className}
			dangerouslySetInnerHTML={{ __html: newContent }}
			style={changed ? { display: "inline-flex" } : undefined}
		/>
	);
};

export default styled(Formula)`
	.katex-display {
		margin: 0;
		padding: 0.1em;
	}
`;
