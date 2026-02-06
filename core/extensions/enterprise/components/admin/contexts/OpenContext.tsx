import { createContext, Dispatch, SetStateAction, useContext } from "react";

interface OpenContextType {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

const OpenContext = createContext<OpenContextType>({
	open: false,
	setOpen: () => {},
});

interface OpenProviderProps {
	children: React.ReactNode;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

export const OpenProvider = ({ children, open, setOpen }: OpenProviderProps) => {
	return <OpenContext.Provider value={{ open, setOpen }}>{children}</OpenContext.Provider>;
};

export const useOpenData = () => {
	const context = useContext(OpenContext);
	return context;
};
