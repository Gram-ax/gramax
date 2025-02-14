import { EditorView } from "@tiptap/pm/view";
import EventEmitter from "eventemitter3";

interface Events {
	addComment: (payload: { pos: number; view: EditorView }) => void;
	onClickComment: (payload: { dom?: HTMLElement }) => void;
}

const commentEventEmitter = new EventEmitter<Events>();

export default commentEventEmitter;
