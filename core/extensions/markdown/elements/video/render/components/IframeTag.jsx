const IframeTag = ({ link }) => {
	return (
		<iframe
			credentialless="true"
			data-focusable="true"
			className="video-js"
			style={{ border: "none" }}
			src={link}
			width="640"
			height="480"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowFullScreen
		/>
	);
};

export default IframeTag;
