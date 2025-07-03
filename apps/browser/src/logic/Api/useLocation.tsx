import { useLocation as useWouterLocation } from "wouter";

const useLocation = (): [string, (to: string, options?: { replace?: boolean }) => void, string] => {
	const [location, setLocation] = useWouterLocation();
	return [location, setLocation, typeof window === "undefined" ? "" : window.location.search];
};

export default useLocation;
