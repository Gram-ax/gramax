import type Application from "@app/types/Application";
import updateSetting from "./updateSetting";

type UpdateSettingArgs = Parameters<typeof updateSetting.do>[0];
type MockApp = {
	conf: Pick<Application["conf"], "isReadOnly">;
	wm: {
		current: () => {
			yaml: () => object;
		};
	};
	settings: {
		appStore: object;
		setBatch: jest.Mock;
	};
};

describe("updateSetting command", () => {
	let mockApp: MockApp;

	const runUpdateSetting = (settings: UpdateSettingArgs["settings"], level: UpdateSettingArgs["level"]) => {
		Reflect.set(updateSetting, "_app", mockApp);

		return updateSetting.do({
			ctx: null as unknown as UpdateSettingArgs["ctx"],
			settings,
			level,
		});
	};

	beforeEach(() => {
		mockApp = {
			conf: { isReadOnly: false },
			wm: {
				current: () => ({
					yaml: () => ({}),
				}),
			},
			settings: {
				appStore: {},
				setBatch: jest.fn(),
			},
		};
	});

	it("accepts any key when not in read-only mode", async () => {
		await runUpdateSetting({ "services.git-proxy": "https://new-proxy.com" }, "app");

		expect(mockApp.settings.setBatch).toHaveBeenCalledWith(
			mockApp.settings.appStore,
			expect.anything(),
			expect.objectContaining({ "services.git-proxy": "https://new-proxy.com" }),
		);
	});

	it("rejects fixed keys when in read-only mode", async () => {
		mockApp.conf.isReadOnly = true;

		await expect(runUpdateSetting({ "services.git-proxy": "https://new-proxy.com" }, "app")).rejects.toThrow(
			/Settings keys not client-writable/,
		);

		expect(mockApp.settings.setBatch).not.toHaveBeenCalled();
	});

	it("accepts overridable keys when in read-only mode", async () => {
		mockApp.conf.isReadOnly = true;

		await runUpdateSetting({ "general.language": "ru" }, "app");

		expect(mockApp.settings.setBatch).toHaveBeenCalledWith(
			mockApp.settings.appStore,
			expect.anything(),
			expect.objectContaining({ "general.language": "ru" }),
		);
	});
});
