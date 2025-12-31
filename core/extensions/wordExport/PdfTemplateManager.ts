import { Workspace } from "@ext/workspace/Workspace";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Buffer } from "buffer";

export const PDF_TEMPLATES_DIR = "pdf";
const PDF_TEMPLATE_FORMATS = ["css"];

class PdfTemplate {
	constructor(private _workspace: Workspace, private _templates: string[]) {}

	getTemplates() {
		return this._templates;
	}

	getTemplate(name: string) {
		return this._workspace.getAssets().pdfTemplates.getContent(name);
	}
}

export class PdfTemplateManager {
	_templates: Record<string, string[]> = {};

	constructor(private _workspaceManager: WorkspaceManager) {
		this._subscribeToWorkspaceEvents();
	}

	async from(workspace?: Workspace): Promise<PdfTemplate | undefined> {
		if (!workspace) return;

		return new PdfTemplate(workspace, await this._getTemplates(workspace));
	}

	async addTemplates(workspace: Workspace, templates: Array<{ name: string; buffer: Buffer }>): Promise<void> {
		await workspace.getAssets().pdfTemplates.add(templates);
		await this._refreshTemplatesCache(workspace);
	}

	async removeTemplates(workspace: Workspace, templateNames: string[]): Promise<void> {
		await workspace.getAssets().pdfTemplates.delete(templateNames);
		await this._refreshTemplatesCache(workspace);
	}

	public static isPdfTemplateName(templateName: string): boolean {
		const dot = templateName.lastIndexOf(".");
		if (dot === -1 || dot === templateName.length - 1) return false;
		const ext = templateName.substring(dot + 1).toLowerCase();
		return PDF_TEMPLATE_FORMATS.some((v) => ext.startsWith(v));
	}

	private _clearCache(workspace: Workspace): void {
		delete this._templates[workspace.path()];
	}

	private async _getTemplates(workspace: Workspace) {
		if (this._templates[workspace.path()]) return this._templates[workspace.path()];

		const templates = await workspace.getAssets().pdfTemplates.list();

		this._templates[workspace.path()] = templates;
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
