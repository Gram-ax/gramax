import dateUtils, { DatePreset } from "@core-ui/utils/dateUtils";

describe("dateUtils", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2024-03-20T12:00:00"));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("15 seconds ago", () => {
		const date = new Date("2024-03-20T11:59:45");
		const formattedDate = dateUtils.getRelativeDateTime(date);
		expect(formattedDate).toBe("15 seconds ago");
	});

	test("15 minutes ago", () => {
		const date = new Date("2024-03-20T11:45:00");
		const formattedDate = dateUtils.getRelativeDateTime(date);
		expect(formattedDate).toBe("15 minutes ago");
	});

	test("4 hours ago", () => {
		const date = new Date("2024-03-20T08:00:00");
		const formattedDate = dateUtils.getRelativeDateTime(date);
		expect(formattedDate).toBe("4 hours ago");
	});

	describe("days", () => {
		test("yesterday", () => {
			const date = new Date("2024-03-19T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("yesterday");
		});

		test("2 days ago", () => {
			const date = new Date("2024-03-18T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("2 days ago");
		});

		test("3 days ago", () => {
			const date = new Date("2024-03-17T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("3 days ago");
		});
	});

	describe("months", () => {
		test("last month", () => {
			const date = new Date("2024-02-18T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("last month");
		});

		test("2 months ago", () => {
			const date = new Date("2024-01-18T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("2 months ago");
		});
	});

	describe("years", () => {
		test("last year", () => {
			const date = new Date("2023-03-20T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("last year");
		});

		test("2 years ago", () => {
			const date = new Date("2022-03-20T12:00:00");
			const formattedDate = dateUtils.getRelativeDateTime(date);
			expect(formattedDate).toBe("2 years ago");
		});
	});
});

describe("DateUtils presets", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2024-03-20T15:30:00"));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("getDatePresetRange", () => {
		test("Today: from is start of today, to is end of today", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Today);
			expect(range.from).toEqual(new Date("2024-03-20T00:00:00.000"));
			expect(range.to).toEqual(new Date("2024-03-20T23:59:59.999"));
		});

		test("Week: from is 6 days ago (start of day), to is end of today", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Week);
			expect(range.from).toEqual(new Date("2024-03-14T00:00:00.000"));
			expect(range.to).toEqual(new Date("2024-03-20T23:59:59.999"));
		});

		test("Month: from is 29 days ago (start of day), to is end of today", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Month);
			expect(range.from).toEqual(new Date("2024-02-20T00:00:00.000"));
			expect(range.to).toEqual(new Date("2024-03-20T23:59:59.999"));
		});

		test("AllTime: returns null from and to", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.AllTime);
			expect(range).toEqual({ from: null, to: null });
		});
	});

	describe("detectPreset", () => {
		test("empty range returns AllTime", () => {
			expect(dateUtils.detectPreset({ from: undefined, to: undefined })).toBe(DatePreset.AllTime);
		});

		test("null range returns AllTime", () => {
			expect(dateUtils.detectPreset(null)).toBe(DatePreset.AllTime);
		});

		test("only from set returns undefined", () => {
			expect(dateUtils.detectPreset({ from: new Date("2024-03-20"), to: undefined })).toBeUndefined();
		});

		test("only to set returns undefined", () => {
			expect(dateUtils.detectPreset({ from: undefined, to: new Date("2024-03-20") })).toBeUndefined();
		});

		test("today range detects Today preset", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Today);
			expect(dateUtils.detectPreset(range)).toBe(DatePreset.Today);
		});

		test("7-day range detects Week preset", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Week);
			expect(dateUtils.detectPreset(range)).toBe(DatePreset.Week);
		});

		test("30-day range detects Month preset", () => {
			const range = dateUtils.getDatePresetRange(DatePreset.Month);
			expect(dateUtils.detectPreset(range)).toBe(DatePreset.Month);
		});

		test("arbitrary range returns undefined", () => {
			expect(
				dateUtils.detectPreset({ from: new Date("2024-01-01"), to: new Date("2024-02-15") }),
			).toBeUndefined();
		});

		test("7-day range not ending today returns undefined", () => {
			expect(
				dateUtils.detectPreset({ from: new Date("2024-03-07"), to: new Date("2024-03-13") }),
			).toBeUndefined();
		});
	});
});
