import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
// import pageProps from "../../../data/pageProps.json";

const Catalog = {
	title: "DocReader/core/Catalog/Catalog",
	decorators: [
		(S) => (
			<div style={{ background: "white", width: "100%", height: "100%" }}>
				<LeftNavigationIsOpenService.Provider>
					<S />
				</LeftNavigationIsOpenService.Provider>
			</div>
		),
	],
};
// const data = pageProps.data as any;

export const Base = () => {
	return (
		// <LeftNavigationComponent data={data} />
		<></>
	);
};

export const Narrow = () => {
	return (
		// <LeftNavigationNarrowComponent data={data} />
		<></>
	);
};

export default Catalog;
