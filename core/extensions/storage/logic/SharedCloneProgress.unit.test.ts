/** @jest-environment node */
import { SharedCloneProgress } from "@ext/storage/logic/SharedCloneProgress";

describe("SharedCloneProgress.onDone", () => {
	it("notifies every registered listener, not just the last one", () => {
		const progress = new SharedCloneProgress("id");
		const calls: string[] = [];

		progress.onDone(() => calls.push("first"));
		progress.onDone(() => calls.push("second"));

		progress.setFinish(false, false);

		expect(calls).toEqual(["first", "second"]);
	});

	it("fires listeners once — the terminal event cannot repeat", () => {
		const progress = new SharedCloneProgress("id");
		const calls: string[] = [];

		progress.onDone(() => calls.push("done"));

		progress.setFinish(false, false);
		progress.setError(new Error("late") as never, false);

		expect(calls).toEqual(["done"]);
	});
});
