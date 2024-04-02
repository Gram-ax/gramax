import { GRAMAX_EDITOR_URL } from "@app/config/const";
import GramaxLogo from "@components/GramaxLogo";
import Anchor from "@components/controls/Anchor";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import { useEffect, useState } from "react";

const EditInGramax = ({ className, shouldRender }: { className?: string; shouldRender: boolean }) => {
	if (!shouldRender) return null;

	const [editInGramaxUrl, setEditInGramaxUrl] = useState<string>(null);
	const catalogProps = CatalogPropsService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const getEditInGramaxLink = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getEditOnAppUrl(articleProps.ref.path));
		if (!res.ok) return;
		setEditInGramaxUrl(await res.text());
	};

	useEffect(() => {
		void getEditInGramaxLink();
	}, [catalogProps.name, articleProps.logicPath]);

	return (
		<li data-qa="qa-clickable" className={className}>
			<div className="wrapper">
				<Anchor href={GRAMAX_EDITOR_URL + "/" + editInGramaxUrl} target="_blank">
					<div className="gramax-icon">
						<GramaxLogo size={14} />
					</div>
					<span>{useLocalize("editOn") + " Gramax"}</span>
				</Anchor>
			</div>
		</li>
	);
};

export default styled(EditInGramax)`
	cursor: pointer;

	:hover {
		.gramax-icon {
			opacity: 1;
		}
	}

	.gramax-icon {
		width: 1.25em;
		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 0.6;
	}

	.wrapper {
		display: flex;
		font-size: 12px;
		line-height: 1.2em;
		margin-bottom: 0.9rem;
	}

	a {
		display: flex;
		align-items: center;
	}

	span {
		padding-left: var(--distance-i-span);
	}
`;
