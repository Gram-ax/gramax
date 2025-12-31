import { Access } from "../../components/roles/Access";

export type SVG = string;

export enum AuthMethod {
	SSO = "sso",
	GUEST_MAIL = "guest_mail",
}

export type AuthOption = {
	label: string;
	value: AuthMethod[];
};

export enum WorkspaceView {
	FOLDER = "folder",
	SECTION = "section",
}

export const viewOptions: { [key in WorkspaceView]: string } = {
	[WorkspaceView.FOLDER]: "Папка",
	[WorkspaceView.SECTION]: "Секция",
};

export const viewLabelToView: { [label: string]: WorkspaceView } = {};
Object.entries(viewOptions).forEach(([view, label]) => {
	viewLabelToView[label] = view as WorkspaceView;
});

export const getViewByLabel = (label: string): WorkspaceView | undefined => {
	return viewLabelToView[label];
};

export const getLabelByView = (view: WorkspaceView): string => {
	return viewOptions[view];
};

export type WorkspaceSection = {
	title: string;
	icon?: string;
	view?: WorkspaceView;
	description?: string;
	catalogs?: string[];
	sections?: Record<string, WorkspaceSection>;
};

export type WorkspaceSettings = {
	name: string;
	source: {
		url: string;
		type: "GitLab";
		repos: string[] | null;
	};
	sections: Record<string, WorkspaceSection>;
	access?: Access;
	style?: {
		logo?: SVG;
		logoDark?: SVG;
		css?: string;
	};
	wordTemplates: ExportTemplate[];
	pdfTemplates: ExportTemplate[];
	modules?: {
		quiz?: boolean;
		guests?: boolean;
		metrics?: boolean;
	};
};

export type WorkspaceFormData = {
	key: string;
	title: string;
	description: string;
	icon: string;
	view: WorkspaceView;
	catalogs: string[];
};

export type ExportTemplate = {
	title: string;
	bufferBase64: string;
};
