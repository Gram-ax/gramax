import { ExtendedWindow, InitialDataKeys } from "./types";

const getStaticFeatures = () => {
	const extendedWindow = window as ExtendedWindow;
	return extendedWindow[InitialDataKeys.CONFIG].features;
};

export default getStaticFeatures;
