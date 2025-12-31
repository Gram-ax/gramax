import { JSONContent } from "@tiptap/react";

export interface CommentUser {
	mail: string;
	name: string;
}

export type CommentDateTime = string;

export interface CommentBlock<ContentType = JSONContent[]> {
	comment?: Comment<ContentType>;
	answers?: Comment<ContentType>[];
}

export interface Comment<ContentType = JSONContent[]> {
	dateTime: CommentDateTime;
	content: ContentType;
	user: CommentUser;
}
