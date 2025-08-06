import { Editor } from "@tiptap/core";
import TextGenerateButton from "@ext/ai/components/Buttons/TextGenerate";

const AIGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<>
			<TextGenerateButton editor={editor} />
		</>
	);
};

export default AIGroup;
