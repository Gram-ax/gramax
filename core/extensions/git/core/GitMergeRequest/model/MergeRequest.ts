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
	creator: Signature;
	approvers: ApprovalSignature[];
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
	approvers: ApprovalSignature[];
	createdAt: Date;
	options?: MergeRequestOptions;
};

export type CreateMergeRequest = {
	targetBranchRef: string;
	title?: string;
	description?: string;
	approvers?: ApprovalSignature[];
	createdAt?: Date;
	options?: MergeRequestOptions;
	forceCreate?: boolean;
};
