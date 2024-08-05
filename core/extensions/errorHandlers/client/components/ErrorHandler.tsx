import Error from "@components/Error";
import { PageDataContextContext } from "@core-ui/ContextServices/PageDataContext";
import React, { ReactNode } from "react";
import PageDataContext from "../../../../logic/Context/PageDataContext";
import sendBug from "../../../bugsnag/logic/sendBug";
import AlertError from "@components/AlertError";

interface ErrorHandlerProps {
	children: ReactNode;
	isAlert?: boolean;
	alertTitle?: string;
}

interface ErrorHandlerState {
	error: Error;
}

class ErrorHandler extends React.Component<ErrorHandlerProps, ErrorHandlerState> {
	constructor(props: ErrorHandlerProps) {
		super(props);
		this.state = { error: null };
	}
	static override contextType = PageDataContextContext;

	static getDerivedStateFromError(error: Error): ErrorHandlerState {
		return { error };
	}

	override componentDidCatch(error: Error): void {
		sendBug(error);
	}

	override render() {
		if (this.state.error)
			return this.props.isAlert ? (
				<AlertError title={this.props.alertTitle} error={this.state.error} />
			) : (
				<Error error={this.state.error} isLogged={(this?.context as PageDataContext)?.isLogged ?? false} />
			);
		return this.props.children;
	}
}

export default ErrorHandler;
