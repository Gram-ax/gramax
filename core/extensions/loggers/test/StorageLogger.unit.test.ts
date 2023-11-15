import StorageLogger from "@ext/loggers/StorageLogger";

describe("StorageStorageLogger выводит логи", () => {
	beforeEach(() => {
		window.localStorage.removeItem(".logs");
	});
	test("если их меньше 1000", () => {
		["a", "b", "c", "d", "e"].forEach((x) => StorageLogger.logInfo(x));

		const logs = StorageLogger.getLogs();

		expect(logs).toEqual(["e", "d", "c", "b", "a"]);
	});
	test("если их больше 1000", () => {
		for (let i = 0; i < 1500; i++) StorageLogger.logInfo("0");
		["a", "b", "c"].forEach((x) => StorageLogger.logInfo(x));

		const logs = StorageLogger.getLogs();

		expect(logs.slice(0, 3)).toEqual(["c", "b", "a"]);
	});
	test("если head переходит через 1000", () => {
		for (let i = 0; i < 999; i++) StorageLogger.logInfo("0");
		["a", "b", "c"].forEach((x) => StorageLogger.logInfo(x));

		const logs = StorageLogger.getLogs();

		expect(logs.slice(0, 3)).toEqual(["c", "b", "a"]);
	});
	test("если head на нуле", () => {
		for (let i = 0; i < 997; i++) StorageLogger.logInfo("0");
		["a", "b", "c"].forEach((x) => StorageLogger.logInfo(x));

		const logs = StorageLogger.getLogs();

		expect(logs.slice(0, 3)).toEqual(["c", "b", "a"]);
	});
	test("если их нет", () => {
		const logs = StorageLogger.getLogs();

		expect(logs).toEqual([]);
	});
});
