export type FsEventKind =
	| { type: "created" }
	| { type: "modified" }
	| { type: "removed" }
	| { type: "renamed"; from: string };

export interface FsEventDto {
	relPath: string;
	kind: FsEventKind;
}

export const BROADCAST_CHANNEL_NAME = "gramax-fs-events";
