export interface GuestsSettings {
	sessionDurationHours: number;
	whitelistEnabled: boolean;
	domains: string[];
}

export interface Domain {
	id: string;
	domain: string;
}
