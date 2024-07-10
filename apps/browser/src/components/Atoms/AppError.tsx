import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { HTMLAttributes } from "react";

const AppError = ({ error, ...props }: { error: DefaultError } & HTMLAttributes<HTMLDivElement>) => {
	const isWasmError = error.props?.errorCode == "wasmInitTimeout";

	return (
		<div {...props}>
			<div className="container">
				<InfoModalForm
					title={isWasmError ? "Этот браузер не поддерживается" : "Не удалось загрузить приложение"}
					icon={{ code: "circle-x", color: "var(--color-danger)" }}
					onCancelClick={null}
					noButtons={true}
				>
					{isWasmError ? (
						<div>
							<span>
								Откройте Gramax в <a href="https://gram.ax/resources/docs/faq">другом браузере</a> или
							</span>
							<a href="https://gram.ax"> скачайте приложение </a>
							<span>на компьютер</span>
						</div>
					) : (
						error?.message ?? "Неизвестная ошибка"
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
