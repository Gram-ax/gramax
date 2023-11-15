const BlockDecorator = (Story) => {
	return (
		<div
			className="block-decorator"
			style={{
				position: "absolute",
				left: "50%",
				transform: "translate(-50%, 0)",
				paddingTop: "1rem",
			}}
		>
			<Story />
		</div>
	);
};

export default BlockDecorator;
