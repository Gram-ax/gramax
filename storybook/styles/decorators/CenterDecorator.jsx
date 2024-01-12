const CenterDecorator = (Story) => {
	return (
		<div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
			<Story />
		</div>
	);
};

export default CenterDecorator;
