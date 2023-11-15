import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditVideo from "../components/Video";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		video: {
			setVideo: () => ReturnType;
			updateVideo: (attrs: { title: string; path: string; isLink: boolean }) => ReturnType;
		};
	}
}

const Video = Node.create({
	name: "video",
	group: "block",

	addAttributes() {
		return { title: { default: null }, path: { default: null }, isLink: { default: true } };
	},

	parseHTML() {
		return [{ tag: "video-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["video-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditVideo);
	},

	addCommands() {
		return {
			setVideo:
				() =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs: { title: "", path: "", isLink: true } });
				},
			updateVideo:
				({ title, path, isLink }: { title: string; path: string; isLink: boolean }) =>
				({ commands }) => {
					return commands.updateAttributes(this.type, { title, path, isLink });
				},
		};
	},
});

export default Video;
