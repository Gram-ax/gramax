import sendBug from "@ext/bugsnag/logic/sendBug";
import DefaultErrorComponent from "@ext/errorHandlers/client/components/DefaultError";
import ErrorHandler, { ErrorHandlerProps } from "@ext/errorHandlers/client/components/ErrorHandler";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";

interface ModalErrorHandlerProps extends ErrorHandlerProps {
	onClose: () => void;
	onError: () => void;
}

class ModalErrorHandler extends ErrorHandler<ModalErrorHandlerProps> {
	constructor(props: ModalErrorHandlerProps) {
		super(props);
	}

	override renderError() {
		return (
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
	}

	override componentDidCatch(error: Error): void {
		this.props.onError();
		sendBug(error);
	}
}

export default ModalErrorHandler;
