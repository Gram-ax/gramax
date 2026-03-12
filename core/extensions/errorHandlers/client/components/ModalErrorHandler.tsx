import sendBug from "@ext/bugsnag/logic/sendBug";
import DefaultErrorComponent from "@ext/errorHandlers/client/components/DefaultError";
import ErrorHandler, { type ErrorHandlerProps } from "@ext/errorHandlers/client/components/ErrorHandler";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type { ComponentType, ReactNode } from "react";

interface ModalErrorHandlerProps extends ErrorHandlerProps {
	onClose: () => void;
	onError?: () => void;
	wrapper?: ComponentType<{ children: ReactNode }>;
}

class ModalErrorHandler extends ErrorHandler<ModalErrorHandlerProps> {
	override renderError() {
		const children = (
			<DefaultErrorComponent
				error={
					new DefaultError(
						t("app.error.command-failed.body"),
						this.state.error,
						{ html: true, showCause: true },
						false,
						t("app.error.command-failed.title"),
					)
				}
				onCancelClick={this.props.onClose}
			/>
		);
		const Wrapper = this.props.wrapper;
		return Wrapper ? <Wrapper>{children}</Wrapper> : children;
	}

	override componentDidCatch(error: Error): void {
		this.props.onError?.();
		sendBug(error);
	}
}

export default ModalErrorHandler;
