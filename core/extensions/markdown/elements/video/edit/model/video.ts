import videoSchema from "@ext/markdown/elements/video/edit/model/videoSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
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
	...getExtensionOptions({ schema: videoSchema, name: "video" }),

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
