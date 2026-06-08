import type { Signature } from "@ext/git/core/model/Signature";

export default interface GitVersionData {
	oid: string;
	author: Signature;
	timestamp: number;
	summary: string;
	parents: string[];
	stat: {
		added: number;
		deleted: number;
		changedFiles?: { path: string; title?: string }[];
	};
}
