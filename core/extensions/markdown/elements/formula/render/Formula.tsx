const removePTags = (html: string) => {
	const newHtml = html.replace(/<p>(.*?)<\/p>/g, "$1");
	const changed = newHtml !== html;
	return { newContent: newHtml, changed };
};

const Formula = ({ content }: { content: string }) => {
	if (!content) return null;

	const { newContent, changed } = removePTags(content);
	return (
		<span
			className="[&_.katex-display]:m-0 [&_.katex-display]:p-[0.1em]"
			// biome-ignore lint/style/useNamingConvention: expected
			dangerouslySetInnerHTML={{ __html: newContent }}
			style={changed ? { display: "inline-flex" } : undefined}
		/>
	);
};

export default Formula;
