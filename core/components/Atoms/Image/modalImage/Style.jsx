import styled from "@emotion/styled";

const Styles = styled(({ className = "", children, imageBackgroundColor, noneShadow }) => (
	<div className={className}>{children}</div>
))`
	body {
		overflow: hidden;
	}
	.__react_modal_image__modal_container {
		position: fixed;
		z-index: 5000;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
		touch-action: none;
		overflow: hidden;
	}
	.__react_modal_image__modal_content {
		background: var(--color-diagram-bg) !important;
		position: relative;
		height: 100%;
		width: 100%;
	}
	.__react_modal_image__modal_content img,
	.__react_modal_image__modal_content svg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate3d(-50%, -50%, 0);
		-webkit-transform: translate3d(-50%, -50%, 0);
		-ms-transform: translate3d(-50%, -50%, 0);
		overflow: hidden;
	}
	.__react_modal_image__medium_img {
		max-width: 98%;
		max-height: 98%;
		background-color: ${(p) => p.imageBackgroundColor};
		${(p) => (p.noneShadow ? "box-shadow: none !important;" : "")}
	}
	.__react_modal_image__large_img {
		cursor: move;
		background-color: ${(p) => p.imageBackgroundColor};
	}
	.__react_modal_image__icon_menu a {
		display: inline-block;
		font-size: 40px;
		cursor: pointer;
		line-height: 40px;
		box-sizing: border-box;
		border: none;
		padding: 0px 5px 0px 5px;
		margin-left: 10px;
		color: white;
		background-color: rgba(0, 0, 0, 0);
	}
	.__react_modal_image__icon_menu {
		float: right;
		display: inline-block;
	}
	.__react_modal_image__caption {
		display: inline-block;
		color: white;
		font-size: 120%;
		padding: 10px;
		margin: 0;
	}
	.__react_modal_image__header {
		position: absolute;
		top: 0;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		overflow: hidden;
	}
	.__react_modal_image__container {
		position: relative;
		transform: translateX(-50%) translateY(-50%);
	}
	.__react_modal_image__objects {
		font-size: 16px !important;
		position: absolute;
		display: block;
		top: 50%;
		left: 50%;
		transform: translateX(-50%) translateY(-50%);
		width: 100%;
		height: 100%;
		z-index: 0;
		margin: 0 auto;
	}
`;

export default Styles;
