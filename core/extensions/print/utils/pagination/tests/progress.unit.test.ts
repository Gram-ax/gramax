import { createProgressTracker } from "../progress";

describe("progress tracker", () => {
	it("emits initial state and updates with increments", () => {
		const reporter = jest.fn();
		const tracker = createProgressTracker({
			totalUnits: 10,
			reporter,
		});

		tracker.emit(true);
		expect(reporter).toHaveBeenCalledTimes(1);
		let call = reporter.mock.calls[0][0];
		expect(call.stage).toBe("exporting");
		expect(call.ratio).toBeCloseTo(0.05, 5);
		expect(call.cliMessage).toBeUndefined();

		tracker.increase(1);
		call = reporter.mock.calls[reporter.mock.calls.length - 1][0];
		expect(call.ratio).toBeCloseTo(0.144, 3);
		expect(call.cliMessage).toBeUndefined();

		tracker.increase(9);
		call = reporter.mock.calls[reporter.mock.calls.length - 1][0];
		expect(call.ratio).toBeCloseTo(0.99, 5);
		expect(call.cliMessage).toBeUndefined();
	});

	it("throttles updates and emits after crossing threshold", () => {
		const reporter = jest.fn();
		const tracker = createProgressTracker({
			totalUnits: 500,
			reporter,
		});

		tracker.emit(true);
		reporter.mockClear();

		for (let i = 0; i < 4; i++) tracker.increase(1);
		expect(reporter).not.toHaveBeenCalled();

		tracker.increase(1);
		expect(reporter).toHaveBeenCalledTimes(1);
		const call = reporter.mock.calls[0][0];
		expect(call.cliMessage).toBeUndefined();
	});
});
