import { shouldPauseFsEventsForCommand, shouldSkipFsEventsForRepositoryState } from "@ext/Watchers/fsEventPause";

describe("fsEventPause", () => {
	test.each([
		"storage/sync",
		"versionControl/branch/checkout",
		"versionControl/branch/mergeInto",
		"versionControl/branch/reset",
		"versionControl/discard",
		"versionControl/mergeConflict/abort",
		"versionControl/mergeConflict/resolve",
	])("pauses watcher events for bulk repository command %s", (command) => {
		expect(shouldPauseFsEventsForCommand(command)).toBe(true);
	});

	test.each([
		"article/updateContent",
		"storage/publish",
		"fs/handleEvents",
	])("does not pause watcher events for ordinary command %s", (command) => {
		expect(shouldPauseFsEventsForCommand(command)).toBe(false);
	});

	test.each(["checkout", "syncing"])("skips backend watcher handling for transient state %s", (state) => {
		expect(shouldSkipFsEventsForRepositoryState(state)).toBe(true);
	});

	test.each([
		"default",
		"mergeConflict",
		"stashConflict",
		undefined,
	])("does not skip backend watcher handling for non-transient state %s", (state) => {
		expect(shouldSkipFsEventsForRepositoryState(state)).toBe(false);
	});
});
