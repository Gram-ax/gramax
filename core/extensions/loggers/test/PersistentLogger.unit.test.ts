import PersistentLogger from "@ext/loggers/PersistentLogger";

describe("PersistentLogger выводит логи", () => {
	beforeEach(() => {
		window.localStorage.removeItem(".logs");
	});
	test("если их меньше 1000", () => {
		["a", "b", "c", "d", "e"].forEach((x) => PersistentLogger.info(x));

		const logs = PersistentLogger.getRawLogs();

		expect(logs.map((x) => JSON.parse(x).b)).toEqual(["e", "d", "c", "b", "a"]);
	});
	test("если их больше 1000", () => {
		for (let i = 0; i < 1500; i++) PersistentLogger.info("0");
		["a", "b", "c"].forEach((x) => PersistentLogger.info(x));

		const logs = PersistentLogger.getRawLogs();

		expect(logs.slice(0, 3).map((x) => JSON.parse(x).b)).toEqual(["c", "b", "a"]);
	});
	test("если head переходит через 1000", () => {
		for (let i = 0; i < 999; i++) PersistentLogger.info("0");
		["a", "b", "c"].forEach((x) => PersistentLogger.info(x));

		const logs = PersistentLogger.getRawLogs();

		expect(logs.slice(0, 3).map((x) => JSON.parse(x).b)).toEqual(["c", "b", "a"]);
	});
	test("если head на нуле", () => {
		for (let i = 0; i < 997; i++) PersistentLogger.info("0");
		["a", "b", "c"].forEach((x) => PersistentLogger.info(x));

		const logs = PersistentLogger.getRawLogs();

		expect(logs.slice(0, 3).map((x) => JSON.parse(x).b)).toEqual(["c", "b", "a"]);
	});
	test("если их нет", () => {
		const logs = PersistentLogger.getRawLogs();

		expect(logs).toEqual([]);
	});
});
