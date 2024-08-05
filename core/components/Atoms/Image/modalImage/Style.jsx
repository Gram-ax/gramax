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
	.__react_modal_image__medium_img {
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
		cursor: pointer !important;
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
	.modal__container__image {
		position: relative;
		max-width: 100%;
		max-height: 100%;
	}
	.modal__container {
		position: relative;
		transform: translate(-50%, -50%);
		left: 50%;
		top: 50%;
		max-width: 98%;
		max-height: 98%;
		width: fit-content;
		height: fit-content;
		box-shadow: var(--shadows-deeplight);
	}
`;

export default Styles;
