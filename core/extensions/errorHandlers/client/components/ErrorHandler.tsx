import ErrorComponent from "@components/Error";
import { PageDataContextContext } from "@core-ui/ContextServices/PageDataContext";
import React, { ReactNode } from "react";
import PageDataContext from "../../../../logic/Context/PageDataContext";
import sendBug from "../../../bugsnag/logic/sendBug";

class ErrorHandler extends React.Component<{ children: ReactNode }, { error: Error }> {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}
	static override contextType = PageDataContextContext;

	static getDerivedStateFromError(error) {
		return { error };
	}

	override componentDidCatch(error) {
		sendBug(error);
	}

	override render() {
		if (this.state.error)
			return (
				<ErrorComponent
					error={this.state.error}
					isLogged={(this?.context as PageDataContext)?.isLogged ?? false}
				/>
			);
		return this.props.children;
	}
}

export default ErrorHandler;
