import { useSearch, useLocation as useWouterLocation } from "wouter";

const useLocation = (): [string, (to: string, options?: { replace?: boolean }) => void, string] => {
	if (typeof window === "undefined") return ["", () => {}, ""];
	const [location, setLocation] = useWouterLocation();
	const search = useSearch();
	return [location, setLocation, search];
};

export default useLocation;
