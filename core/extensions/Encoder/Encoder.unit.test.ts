import { Encoder } from "./Encoder";

describe("Encoder", () => {
	const datas = ["data1", "data2", "data3"];
	const accessToken = "testToken";
	const encoder = new Encoder();

	describe("корректно шифрует и расшивровывает данные", () => {
		test("base64", () => {
			const ticket = encoder.ecode(datas, accessToken, "base64");
			const decodingData = encoder.decode(accessToken, ticket, "base64");

			expect(decodingData).toEqual(datas);
		});
		test("hex", () => {
			const ticket = encoder.ecode(datas, accessToken, "hex");
			const decodingData = encoder.decode(accessToken, ticket, "hex");

			expect(decodingData).toEqual(datas);
		});
	});

	describe("не возвращает никакие данные,", () => {
		describe("если токен не корректный", () => {
			test("base64", () => {
				const wrongAccessToken = "wrongTestToken";

				const ticket = encoder.ecode(datas, accessToken, "base64");
				const decodingData = encoder.decode(wrongAccessToken, ticket, "base64");

				expect(decodingData).toEqual(null);
			});
			test("hex", () => {
				const wrongAccessToken = "wrongTestToken";

				const ticket = encoder.ecode(datas, accessToken, "hex");
				const decodingData = encoder.decode(wrongAccessToken, ticket, "hex");

				expect(decodingData).toEqual(null);
			});
		});

		describe("если тикет не корректный", () => {
			test("base64", () => {
				const wrongTicket = "wrongTestTicket";

				const decodingData = encoder.decode(accessToken, wrongTicket, "base64");

				expect(decodingData).toEqual(null);
			});
			test("hex", () => {
				const wrongTicket = "wrongTestTicket";

				const decodingData = encoder.decode(accessToken, wrongTicket, "hex");

				expect(decodingData).toEqual(null);
			});
		});
	});
});
