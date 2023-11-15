import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const VideoMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			icon="video"
			tooltipText="Видео"
			nodeValues={{ action: "video" }}
			onClick={() => editor.chain().focus().setVideo().run()}
		/>
	);
};

export default VideoMenuButton;
