interface E2E {
	documentReady: boolean;
	updateContent: () => void;
}

const getE2E: () => E2E = () => {
	if (typeof window !== "undefined") return window as any;
	else return {};
};

export default getE2E;
