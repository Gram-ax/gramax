import type { GitVersion } from "@ext/git/core/model/GitVersion";

export type Signature = {
	name: string;
	email: string;
};

export type ApprovalSignature = Signature & {
	approvedAt?: Date;
};

export type MergeRequestOptions = { deleteAfterMerge: boolean };

export type MergeRequest = {
	targetBranchRef: string;
	sourceBranchRef: string;
	title: string;
	author: Signature;
	assignees: ApprovalSignature[];
	createdAt: Date;
	updatedAt: Date;
	description?: string;
	createdAtCommitOid?: GitVersion;
	options?: MergeRequestOptions;
};

export type OpenMergeRequest = {
	title: string;
	description?: string;
	target: string;
	author: Signature;
	assignees: ApprovalSignature[];
	createdAt: Date;
	options?: MergeRequestOptions;
};

export type CreateMergeRequest = {
	targetBranchRef: string;
	title?: string;
	description?: string;
	assignees?: ApprovalSignature[];
	createdAt?: Date;
	options?: MergeRequestOptions;
};
