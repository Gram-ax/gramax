import { Range } from "@tiptap/core";

interface CommentStorage {
	openedComment: { id: string; position: Range };
	hoverComment: string;
	positions: Map<string, Range[]>;
}

interface CommentOptions {
	enabled?: boolean;
	onMarkDeleted?: (id: string, positions: Range[]) => void;
	onMarkAdded?: (id: string, positions: Range[]) => void;
}

export type { CommentStorage, CommentOptions };