type isomorphicGitCaller =
	| "Errors"
	| "STAGE"
	| "TREE"
	| "WORKDIR"
	| "add"
	| "abortMerge"
	| "addNote"
	| "addRemote"
	| "annotatedTag"
	| "branch"
	| "checkout"
	| "clone"
	| "commit"
	| "getConfig"
	| "getConfigAll"
	| "setConfig"
	| "currentBranch"
	| "deleteBranch"
	| "deleteRef"
	| "deleteRemote"
	| "deleteTag"
	| "expandOid"
	| "expandRef"
	| "fastForward"
	| "fetch"
	| "findMergeBase"
	| "findRoot"
	| "getRemoteInfo"
	| "getRemoteInfo2"
	| "hashBlob"
	| "indexPack"
	| "init"
	| "isDescendent"
	| "isIgnored"
	| "listBranches"
	| "listFiles"
	| "listNotes"
	| "listRemotes"
	| "listServerRefs"
	| "listTags"
	| "log"
	| "merge"
	| "packObjects"
	| "pull"
	| "push"
	| "readBlob"
	| "readCommit"
	| "readNote"
	| "readObject"
	| "readTag"
	| "readTree"
	| "remove"
	| "removeNote"
	| "renameBranch"
	| "resetIndex"
	| "updateIndex"
	| "resolveRef"
	| "status"
	| "statusMatrix"
	| "tag"
	| "version"
	| "walk"
	| "writeBlob"
	| "writeCommit"
	| "writeObject"
	| "writeRef"
	| "writeTag"
	| "writeTree";

export type Caller = isomorphicGitCaller;
