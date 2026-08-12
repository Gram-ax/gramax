import type { CommentBlock } from "@core-ui/CommentBlock";
import type { Range } from "@tiptap/core";

interface CommentStorage {
	openedComment: { id: string; position: Range };
	hoverComment: string;
	positions: Map<string, Range[]>;
	/** Every comment of the article, keyed by id. Source of truth for the comment popover and for clipboard serialization. */
	comments: Map<string, CommentBlock>;
	/** Comments whose mark left the document. Kept so undo (and cut → paste) can restore them without a round trip. */
	deleted: Map<string, CommentBlock>;
}

interface CommentOptions {
	appendCommentToBody?: boolean;
	enabled?: boolean;
	onMarkDeleted?: (id: string, positions: Range[]) => void;
	onMarkAdded?: (id: string, positions: Range[]) => void;
}

export type { CommentOptions, CommentStorage };
