import { useLocation as useReactRouter, useNavigate } from "react-router-dom";

const useLocation = (): [string, (to: string, options?: { replace?: boolean }) => void, string] => {
	const reactRouter = useReactRouter();
	const setLocation = useNavigate();
	return [reactRouter.pathname, setLocation, reactRouter.search];
};

export default useLocation;
