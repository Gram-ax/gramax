import { Component } from "react";
import { SpinnerIcon } from "./icons";

export default class Image extends Component {
	state = {
		loading: true,
	};

	handleOnLoad = () => {
		this.setState({ loading: false });
	};

	handleOnContextMenu = (event) => {
		!this.props.contextMenu && event.preventDefault();
	};

	render() {
		const { id, className, src, style, handleDoubleClick } = this.props;

		return (
			<div>
				{this.state.loading && <SpinnerIcon />}
				<img
					id={id}
					className={className}
					src={src}
					style={style}
					onLoad={this.handleOnLoad}
					onDoubleClick={handleDoubleClick}
					onContextMenu={this.handleOnContextMenu}
				/>
			</div>
		);
	}
}
