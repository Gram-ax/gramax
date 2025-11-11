import { createContext, useContext } from "react";

const ScrollContainerContext = createContext<HTMLDivElement | null>(null);

interface ScrollContainerProviderProps {
	children: React.ReactNode;
	container: HTMLDivElement | null;
}

export const ScrollContainerProvider = ({ children, container }: ScrollContainerProviderProps) => (
	<ScrollContainerContext.Provider value={container}>{children}</ScrollContainerContext.Provider>
);

export const useScrollContainer = () => {
	const context = useContext(ScrollContainerContext);
	return context;
};
