import PageDataContextService from "../ContextServices/PageDataContext";

const IsReadOnlyHOC = ({ children }: { children: JSX.Element }) => {
	if (PageDataContextService.value.conf.isReadOnly) return null;
	return children;
};

export default IsReadOnlyHOC;
