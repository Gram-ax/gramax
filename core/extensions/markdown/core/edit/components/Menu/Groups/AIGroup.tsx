import TextGenerateButton from "@ext/ai/components/Buttons/TextGenerate";
import { Editor } from "@tiptap/core";
import { memo } from "react";

const AIGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<>
			<TextGenerateButton editor={editor} />
		</>
	);
};

export default memo(AIGroup);
