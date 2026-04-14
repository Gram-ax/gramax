const canShowVersion = (gesUrl: string, isLogged: boolean) => {
	if (!gesUrl) return true;
	return isLogged;
};

export default canShowVersion;
