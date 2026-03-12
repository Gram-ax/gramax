import type { MergeConflictInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";

export interface GitAutoMergerModel {
	canProceed(conflict: MergeConflictInfo): boolean;
	proceed(conflictContent: string): Promise<string>;
}
