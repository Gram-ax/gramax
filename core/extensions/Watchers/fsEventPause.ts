const FS_EVENT_PAUSE_COMMANDS = new Set([
	"storage/sync",
	"versionControl/branch/checkout",
	"versionControl/branch/mergeInto",
	"versionControl/branch/reset",
	"versionControl/discard",
	"versionControl/mergeConflict/abort",
	"versionControl/mergeConflict/resolve",
]);

const FS_EVENT_SKIP_REPOSITORY_STATES = new Set(["checkout", "syncing"]);

export const shouldPauseFsEventsForCommand = (command: string): boolean => FS_EVENT_PAUSE_COMMANDS.has(command);

export const shouldSkipFsEventsForRepositoryState = (state: string | undefined): boolean =>
	!!state && FS_EVENT_SKIP_REPOSITORY_STATES.has(state);
