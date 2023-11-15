import styled from "@emotion/styled";
import ErrorForm from "@ext/errorHandlers/client/components/ErrorForm";
import { HTMLAttributes } from "react";

const invoke = (window as any).__TAURI__?.primitives?.invoke;

const AppError = ({ error, ...props }: { error: Error } & HTMLAttributes<HTMLDivElement>) => {
	return (
		<div {...props}>
			<div className="container">
				<ErrorForm
					title={"Не удалось загрузить каталоги"}
					icon={{ code: "circle-xmark", color: "var(--color-danger)" }}
					closeButton={invoke ? { text: "Настройки" } : null}
					onCancelClick={invoke ? () => invoke("show_settings") : null}
				>
					{error.message ?? "Неизвестная ошибка"}
				</ErrorForm>
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
