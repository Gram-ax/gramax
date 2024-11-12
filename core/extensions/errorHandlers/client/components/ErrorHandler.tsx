import Error from "@components/Error";
import { PageDataContextContext } from "@core-ui/ContextServices/PageDataContext";
import React, { ReactNode } from "react";
import PageDataContext from "../../../../logic/Context/PageDataContext";
import sendBug from "../../../bugsnag/logic/sendBug";

export interface ErrorHandlerProps {
	children: ReactNode;
}

interface ErrorHandlerState {
	error: Error;
}

class ErrorHandler<
	P extends ErrorHandlerProps = ErrorHandlerProps,
	S extends ErrorHandlerState = ErrorHandlerState,
> extends React.Component<P, S> {
	constructor(props: P) {
		super(props);
		this.state = { error: null } as S;
	}
	static override contextType = PageDataContextContext;

	static getDerivedStateFromError(error: Error): ErrorHandlerState {
		return { error };
	}

	override componentDidCatch(error: Error): void {
		sendBug(error);
	}

	renderError() {
		return <Error error={this.state.error} isLogged={(this?.context as PageDataContext)?.isLogged ?? false} />;
	}

	override render() {
		if (this.state.error) {
			return this.renderError();
		}
		return this.props.children;
	}
}

export default ErrorHandler;
