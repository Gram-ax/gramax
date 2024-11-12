import Icon from "@components/Atoms/Icon";
import Breadcrumb from "@components/Breadcrumbs/Breadcrumb";
import styled from "@emotion/styled";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { ReactElement, useEffect, useRef, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import C4Data from "../diagrams/c4Diagram/C4Data";
import DiagramRender from "./DiagramRender";

const C4Render = styled(
	({ data, error, className }: { data?: C4Data; error?: Error; className?: string }): ReactElement => {
		const ref = useRef<HTMLDivElement>(null);
		const [parentDiagramIndexes, setParentDiagramIndexes] = useState<number[]>([]);
		const [currentDiagramIndex, setCurrentDiagramIndex] = useState(0);
		const [isFull, setIsFull] = useState(false);
		const [isHover, setIsHover] = useState(false);

		const keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsFull(false);
		};
		useEffect(() => {
			document.addEventListener("keydown", keydownHandler, false);
			return () => {
				document.removeEventListener("keydown", keydownHandler, false);
			};
		});

		useEffect(() => {
			if (!data || !ref?.current) return;
			const diagramNames = [];
			const anchors = ref.current.getElementsByTagName("a");
			for (let i = 0; i < anchors.length; i++) {
				const a = anchors.item(i);
				a.onclick = () => {
					parentDiagramIndexes.push(currentDiagramIndex);
					setParentDiagramIndexes(parentDiagramIndexes.slice());
					setCurrentDiagramIndex(data.viz.findIndex((d) => diagramNames[i] == d.shortName));
				};
				if (a?.href) {
					const name = (a.href as unknown as SVGAnimatedString).baseVal.replace(/.*:\/\/view\//, "");
					if (name) diagramNames.push(name);
					a.removeAttribute("href");
					a.removeAttribute("xlink:href");
					a.setAttribute("title", a.getAttribute("title").replace(/.*:\/\/view\//, ""));
					a.setAttribute("xlink:title", a.getAttribute("xlink:title").replace(/.*:\/\/view\//, ""));
					a.setAttribute("class", "linked-block");
				}
			}
		}, [data, currentDiagramIndex, parentDiagramIndexes]);

		if (error) return <DiagramError error={error} diagramName={DiagramType["c4-diagram"]} />;

		return (
			<div
				className={`${className} diagram-image`}
				style={isFull ? { width: "100%" } : null}
				data-focusable="true"
			>
				<div
					className={`diagram-background block-elevation-large ${isFull ? "full" : ""}`}
					onMouseEnter={() => setIsHover(true)}
					onMouseLeave={() => setIsHover(false)}
				>
					{isHover ? (
						<div className="hover-right-button" onClick={() => setIsFull(!isFull)}>
							<Icon code={isFull ? "minimize" : "maximize"} isAction={true} />
						</div>
					) : null}
					<div className="c4-breadcrumb">
						<Breadcrumb
							title={`C4 MODEL ${currentDiagramIndex == 0 ? "" : "•"} `}
							content={parentDiagramIndexes.map((i) => ({
								text: data.viz[i].shortName,
								onClick: () => {
									setCurrentDiagramIndex(i);
									const pdi = parentDiagramIndexes.slice();
									setParentDiagramIndexes(pdi.slice(0, pdi.indexOf(i)));
								},
							}))}
						/>
					</div>
					<DiagramRender
						ref={ref}
						data={data?.viz?.[currentDiagramIndex]?.svg}
						error={error}
						diagramName={DiagramType["c4-diagram"]}
						isFull={isFull}
						background={false}
						dataFocusable={false}
					/>
				</div>
			</div>
		);
	},
)`
	.c4-breadcrumb > div {
		color: var(--color-breadcrumb-text) !important;
		a {
			color: var(--color-breadcrumb-text) !important;
		}
		a:hover {
			color: (--color-breadcrumb-text-hover) !important;
		}
	}

	svg {
		border-radius: 5px;
		background: none !important;
	}

	a.linked-block {
		text-decoration: none !important;
		fill: white;
	}

	.linked-block text[font-size="16"] {
		text-decoration: underline;
	}

	.linked-block rect {
		transition: 0.15s;
	}

	.linked-block:hover rect {
		transition: 0.15s;
		opacity: 0.8;
	}

	.hover-right-button {
		background: none !important;
		> i {
			color: var(--color-breadcrumb-text) !important;
		}
	}
	.hover-right-button:hover > i {
		color: var(--color-breadcrumb-text-hover) !important;
	}

	.full {
		height: 100%;
		width: 100%;
		position: fixed;
		left: 0px;
		top: 0px;
		margin: 0px;
		display: flex;
		flex-direction: column;
		z-index: var(--z-index-popover);

		> div:last-child {
			height: 100%;

			> div {
				height: 100%;
			}
		}
	}
`;

export default C4Render;
