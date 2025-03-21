import RightNavigationComponent from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationComponent";

const RightNavigationData = {
	title: "gx/Layouts/RightNavigation",
	decorators: [
		(S) => (
			<div style={{ background: "white", width: "100%", height: "100%" }}>
				<S />
			</div>
		),
	],
};

export const RightNavigation = () => {
	return <RightNavigationComponent />;
};

export default RightNavigationData;
