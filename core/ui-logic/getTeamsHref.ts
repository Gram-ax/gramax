const getTeamsHref = (mail: string) => {
	return `https://teams.microsoft.com/l/chat/0/0?users=${mail}`;
};

export default getTeamsHref;
