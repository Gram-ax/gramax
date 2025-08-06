import { JSONContent } from "@tiptap/react";

export interface CommentBlock<ContentType = JSONContent[]> {
	comment?: Comment<ContentType>;
	answers?: Comment<ContentType>[];
}

export interface Comment<ContentType = JSONContent[]> {
	dateTime: string;
	content: ContentType;
	user: { mail: string; name: string };
}
