import useWatch from "@core-ui/hooks/useWatch";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

interface AdminPageParams {
	tabId?: string;
	entityId?: string;
	groupId?: string;
	repositoryId?: string;
	dataProviderAvailable?: boolean;
}

interface AdminPageData {
	page: Page;
	params: AdminPageParams;
	setPage: Dispatch<SetStateAction<Page>>;
	setParams: Dispatch<SetStateAction<AdminPageParams>>;
}

const AdminPageDataContext = createContext<AdminPageData>({
	page: undefined,
	setPage: () => {},
	params: {
		tabId: "",
		entityId: "",
		groupId: "",
		repositoryId: "",
	},
	setParams: () => {},
});

interface AdminPageDataProviderProps {
	children: React.ReactNode;
}

export const AdminPageDataProvider = ({ children }: AdminPageDataProviderProps) => {
	const [page, setPage] = useState<Page>(Page.WORKSPACE);
	const [params, setParams] = useState<AdminPageParams>({
		tabId: "",
		entityId: "",
		groupId: "",
		repositoryId: "",
	});

	useWatch(() => {
		setParams({ tabId: "", entityId: "", groupId: "", repositoryId: "" });
	}, [page]);

	return (
		<AdminPageDataContext.Provider value={{ params, setParams, page, setPage }}>
			{children}
		</AdminPageDataContext.Provider>
	);
};

export const useAdminPageData = () => {
	const context = useContext(AdminPageDataContext);
	return context;
};
