import { createContext, type RefObject, useContext } from "react";

interface AdminHeaderContextValue {
	headerRef: RefObject<HTMLElement>;
}

const AdminHeaderContext = createContext<AdminHeaderContextValue | null>(null);

export const AdminHeaderProvider = AdminHeaderContext.Provider;

export const useAdminHeader = () => {
	return useContext(AdminHeaderContext);
};
