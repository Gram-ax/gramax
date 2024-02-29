/**
 * @jest-environment node
 */

import ApiRequest from "@core/Api/ApiRequest";
import { apiUtils } from "@core/Api/apiUtils";

describe("apiUtils", () => {
	describe("возвращает протокол и адрес хоста по url'y", () => {
		it("localhost", () => {
			const req: ApiRequest = { headers: { referer: "localhost:9090" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "localhost:9090" });
		});

		it("127.0.0.1", () => {
			const req: ApiRequest = { headers: { referer: "127.0.0.1:9090" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "127.0.0.1:9090" });
		});

		it("192.168.1.1 (http)", () => {
			const req: ApiRequest = { headers: { referer: "http://192.168.1.1" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "192.168.1.1" });
		});

		it("app.gram.ax (https)", () => {
			const req: ApiRequest = { headers: { referer: "https://app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "https", host: "app.gram.ax" });
		});

		it("app.gram.ax (http)", () => {
			const req: ApiRequest = { headers: { referer: "http://app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});

		it("app.gram.ax, когда нет 'referer'", () => {
			const req: ApiRequest = { headers: { "x-forwarded-host": "app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});

		it("app.gram.ax (http), когда нет 'referer'", () => {
			const req: ApiRequest = { headers: { host: "app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});
	});
});
