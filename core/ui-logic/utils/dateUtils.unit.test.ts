import dateUtils from "@core-ui/utils/dateUtils";

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
