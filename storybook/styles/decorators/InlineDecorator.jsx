const InlineDecorator = (Story) => {
	return (
		<div className="inline-decorator" style={{ padding: "1rem 1rem 0 1rem", width: "fit-content" }}>
			<Story />
		</div>
	);
};

export default InlineDecorator;
