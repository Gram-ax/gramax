import type { GitRevisionsFilter } from "@ext/git/actions/Revisions/model/GitRevisionsFilter";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import { createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type RevisionArticleFilter = {
	name: string;
	path: string;
	pathname: string;
};

type Filters = Omit<GitRevisionsFilter, "paths"> & {
	articles?: RevisionArticleFilter[];
};

type RevisionsCompare = {
	from: GitVersionData;
	to: GitVersionData;
};

interface RevisionCatalogStore {
	status: "comparing" | "default";
	revision: GitVersionData;
	diffTree: DiffTree;
	compareDiffTree: DiffTree;
	revisions: GitVersionData[];
	reachedFirstCommit: boolean;
	filter: Filters;
	revisionsCompare: RevisionsCompare;
	scrollY: number;

	setFilter: (filter: Filters) => void;
	setRevision: (revision: string) => void;
	setDiffTree: (diffTree: DiffTree) => void;
	setCompareDiffTree: (compareDiffTree: DiffTree) => void;
	setRevisions: (revisions: GitVersionData[]) => void;
	setReachedFirstCommit: (reachedFirstCommit: boolean) => void;
	setRevisionsCompare: (revisionsCompare: RevisionsCompare) => void;
	setStatus: (status: "comparing" | "default") => void;
	setScrollY: (scrollY: number) => void;
}

export const revisionCatalogStore = createStore<RevisionCatalogStore>((set, get) => ({
	status: "default",
	revision: null,
	diffTree: null,
	compareDiffTree: null,
	revisions: null,
	reachedFirstCommit: false,
	filter: null,
	revisionsCompare: null,
	scrollY: 0,

	setFilter: (filter) => set({ filter }),
	setRevision: (oid) => {
		const revisionData = get().revisions?.find((revision) => revision.oid === oid);
		if (!revisionData) return;
		set({ revision: revisionData });
	},
	setDiffTree: (diffTree) => set({ diffTree }),
	setCompareDiffTree: (compareDiffTree) => set({ compareDiffTree }),
	setRevisions: (revisions) => set({ revisions }),
	setReachedFirstCommit: (reachedFirstCommit) => set({ reachedFirstCommit }),
	setRevisionsCompare: (revisionsCompare) => set({ revisionsCompare }),
	setStatus: (status) => set({ status }),
	setScrollY: (scrollY) => set({ scrollY }),
}));

export const useRevisionCatalogStore = <T>(selector: (state: RevisionCatalogStore) => T): T => {
	return useStoreWithEqualityFn(revisionCatalogStore, selector, shallow);
};
