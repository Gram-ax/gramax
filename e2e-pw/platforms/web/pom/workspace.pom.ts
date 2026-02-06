import type { ClientWorkspaceConfig, WorkspaceConfig } from "@gramax/core/extensions/workspace/WorkspaceConfig";
import { expect } from "@playwright/test";
import type { PlaywrightPage } from "@shared-pom/page";

export type WorkspaceInfo = {
	current: WorkspaceConfig;
	workspaces: ClientWorkspaceConfig[];
};

export class WorkspacePom {
	static readonly SwitchWorkspaceTriggerTestId = "switch-workspace";

	constructor(private _page: PlaywrightPage) {}

	async assertCurrentWorkspace(config: Partial<WorkspaceConfig>) {
		const { current } = await this._info();
		expect(current).toMatchObject(config);
	}

	async assertHasCatalogs(catalogs: string[]) {
		expect(await this._catalogs()).toEqual(catalogs);
	}

	async assertWorkspaces(configs: Partial<ClientWorkspaceConfig>[]) {
		const { workspaces } = await this._info();

		expect(workspaces).toHaveLength(configs.length);

		for (let i = 0; i < configs.length; i++) {
			expect(workspaces[i]).toMatchObject(configs[i]!);
		}
	}

	private async _catalogs(): Promise<string[]> {
		return await this._page.evaluate(async () => {
			const { wm } = await window.app!;
			return Array.from(wm.current().getAllCatalogs().keys());
		});
	}

	private async _info(): Promise<WorkspaceInfo> {
		return await this._page.evaluate(async () => {
			const { wm } = await window.app!;
			const workspaces = wm.workspaces();
			const current = await wm.current().config();
			return { current, workspaces };
		});
	}
}
