import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Alert, { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import { addScopeToPath } from "@ext/versioning/utils";
import type { HTMLAttributes } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

export type NotActualRevisionWarningProps = HTMLAttributes<HTMLDivElement>;

// todo: remove word break in code
const NotActualRevisionWarning = (props: NotActualRevisionWarningProps) => {
	const resolvedVersion = useCatalogPropsStore((state) => state.data.resolvedVersion);
	const router = useRouter();

	const { className, ...restProps } = props;

	const url = addScopeToPath(router.path);

	return (
		<div data-qa="switch-version-warning" className={classNames(className, {}, ["article-body"])} {...restProps}>
			<Alert type={AlertType.warning} title={t("versions.not-actual-warning.header")}>
				<div>
					<div>
						{t("versions.not-actual-warning.1")}
						<code>
							<Icon code="tag" />
							<span>{resolvedVersion?.name}</span>
						</code>
					</div>
					<div
						dangerouslySetInnerHTML={{
							__html: t("versions.not-actual-warning.2").replace("{{link}}", url),
						}}
					/>
				</div>
			</Alert>
		</div>
	);
};

export default styled(NotActualRevisionWarning)`
	flex: 0 !important;
`;
