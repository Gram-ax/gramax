import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { HTMLAttributes } from "react";

const AppError = ({ error, ...props }: { error: DefaultError } & HTMLAttributes<HTMLDivElement>) => {
	const isWasmError = error.props?.errorCode == "wasmInitTimeout";

	return (
		<div {...props}>
			<div className="container">
				<InfoModalForm
					title={isWasmError ? t("app.error.browser-not-supported.title") : t("app.error.cannot-load")}
					icon={{ code: "circle-x", color: "var(--color-danger)" }}
					onCancelClick={null}
					noButtons={true}
				>
					{isWasmError ? (
						<div dangerouslySetInnerHTML={{ __html: t("app.error.browser-not-supported.desc") }}></div>
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
