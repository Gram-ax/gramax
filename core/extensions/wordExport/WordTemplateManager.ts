import Path from "@core/FileProvider/Path/Path";
import { Workspace } from "@ext/workspace/Workspace";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Buffer } from "buffer";

const WORD_TEMPLATES_DIR = "word";
const WORD_TEMPLATE_FORMATS = ["doc", "dot"];

class WordTemplate {
	constructor(private _workspace: Workspace, private _templates: string[]) {}

	getTemplates() {
		return this._templates;
	}

	getTemplate(name: string) {
		return this._workspace.getAssets().getBuffer(Path.join(WORD_TEMPLATES_DIR, name));
	}
}

export class WordTemplateManager {
	_templates: Record<string, string[]> = {};

	constructor(private _workspaceManager: WorkspaceManager) {
		this._subscribeToWorkspaceEvents();
	}

	async from(workspace?: Workspace): Promise<WordTemplate | undefined> {
		if (!workspace) return;

		return new WordTemplate(workspace, await this._getTemplates(workspace));
	}

	async addTemplates(workspace: Workspace, templates: Array<{ name: string; buffer: Buffer }>): Promise<void> {
		for (const template of templates) {
			await workspace.getAssets().write(Path.join(WORD_TEMPLATES_DIR, template.name), template.buffer);
		}

		await this._refreshTemplatesCache(workspace);
	}

	async removeTemplates(workspace: Workspace, templateNames: string[]): Promise<void> {
		for (const name of templateNames) {
			await workspace.getAssets().delete(Path.join(WORD_TEMPLATES_DIR, name));
		}

		await this._refreshTemplatesCache(workspace);
	}

	private _clearCache(workspace: Workspace): void {
		delete this._templates[workspace.path()];
	}

	private async _getTemplates(workspace: Workspace) {
		if (this._templates[workspace.path()]) return this._templates[workspace.path()];

		const templates = (await workspace.getAssets().listFiles(WORD_TEMPLATES_DIR)) || [];

		this._templates[workspace.path()] = templates.filter((template) => {
			const lastDotIndex = template.lastIndexOf(".");
			if (lastDotIndex === -1 || lastDotIndex === template.length - 1) return false;

			const extension = template.substring(lastDotIndex + 1).toLowerCase();
			return WORD_TEMPLATE_FORMATS.some((prefix) => extension.startsWith(prefix));
		});
		return this._templates[workspace.path()];
	}

	private async _refreshTemplatesCache(workspace: Workspace): Promise<string[]> {
		this._clearCache(workspace);
		return await this._getTemplates(workspace);
	}

	private _subscribeToWorkspaceEvents(): void {
		this._subscribeToCurrentWorkspace();
		this._subscribeToWorkspaceChanges();
	}

	private _subscribeToCurrentWorkspace(): void {
		const currentWorkspace = this._workspaceManager.maybeCurrent();
		if (currentWorkspace) {
			currentWorkspace.events.on("config-updated", () => {
				this._clearCache(currentWorkspace);
			});
		}
	}

	private _subscribeToWorkspaceChanges(): void {
		this._workspaceManager.events.on("workspace-changed", ({ workspace }) => {
			this._subscribeToWorkspace(workspace);
		});
	}

	private _subscribeToWorkspace(workspace: Workspace): void {
		workspace.events.on("config-updated", () => {
			this._clearCache(workspace);
		});
	}
}
