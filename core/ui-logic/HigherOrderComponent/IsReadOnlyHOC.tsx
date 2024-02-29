import { ReactNode } from "react";
import PageDataContextService from "../ContextServices/PageDataContext";

const IsReadOnlyHOC = ({ children }: { children: ReactNode }) => {
	if (PageDataContextService.value.conf.isReadOnly) return null;
	return children;
};

export default IsReadOnlyHOC;
