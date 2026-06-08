export type GesCloudUsersSettings = {
	count: number;
	users: string[] | null;
};

export type GesCloudMember = {
	email: string;
	type: "user" | "invite";
	isOwner?: boolean;
};
