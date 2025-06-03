const getCloudLoginByLocation = (location: Location) => {
	return location.hostname.split(".")?.[0] ?? null;
};

export default getCloudLoginByLocation;
