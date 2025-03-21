import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { HTMLAttributes } from "react";

const errorCodes = {
	wasmInitTimeout: {
		title: "app.error.browser-not-supported.title",
		desc: "app.error.browser-not-supported.desc",
	},
	notHttps: {
		title: "app.error.cannot-load",
		desc: "app.error.not-https",
	},
	generic: {
		title: "app.error.cannot-load",
	},
};

const AppError = ({ error, ...props }: { error: DefaultError } & HTMLAttributes<HTMLDivElement>) => {
	const errorInfo = errorCodes[error.props?.errorCode] ?? errorCodes.generic;

	return (
		<div {...props}>
			<div className="container">
				<InfoModalForm
					title={t(errorInfo.title)}
					icon={{ code: "circle-x", color: "var(--color-danger)" }}
					onCancelClick={null}
					noButtons={true}
				>
					{errorInfo.desc ? (
						<div dangerouslySetInnerHTML={{ __html: t(errorInfo.desc) }}></div>
					) : (
						error?.message ?? t("app.error.unknown-error")
					)}
				</InfoModalForm>
			</div>
		</div>
	);
};

const AppErrorStyled = styled(AppError)`
	.container {
		width: var(--default-form-width);
	}

	display: flex;
	height: 100%;
	width: 100%;
	align-items: center;
	justify-content: center;
`;

export default AppErrorStyled;
