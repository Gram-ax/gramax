import CatalogPropsEditor from "./CatalogPropsEditor";

type CatalogEditActionProps = {
	shouldRender?: boolean;
	trigger: JSX.Element;
};

const CatalogEditAction = ({ shouldRender = true, trigger }: CatalogEditActionProps) => {
	return shouldRender && <CatalogPropsEditor trigger={trigger} />;
};

export default CatalogEditAction;
