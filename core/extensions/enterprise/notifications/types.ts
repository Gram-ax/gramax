export enum NotificationState {
	OnCreate = "on-create",
	OnChange = "on-change",
	OnBoth = "on-both",
	Disabled = "disabled",
}

export interface ArticleNotificationSettings {
	state?: string;
	groups?: string[];
	users?: string[];
}
