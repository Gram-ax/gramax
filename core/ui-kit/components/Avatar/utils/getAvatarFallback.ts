export const getAvatarFallback = (userName: string): string => {
	if (!userName.includes(" ")) return userName.slice(0, 1).toLocaleUpperCase();
	const [firstName, lastName] = userName.split(" ");
	return (firstName[0] + lastName[0]).toLocaleUpperCase();
};
