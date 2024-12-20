const getZoomDecorator = (zoomLvl = 2) => {
	return (Story) => (
		<div style={{ zoom: zoomLvl }}>
			<Story />
		</div>
	);
};

export default getZoomDecorator;
