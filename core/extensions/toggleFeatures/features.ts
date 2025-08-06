import { getExecutingEnvironment } from "@app/resolveModule/env";
import assert from "assert";

export enum FeatureTarget {
	web = 1 << 0,
	desktop = 1 << 1,
	docportal = 1 << 2,
	static = 1 << 3,
	all = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),
}

export const FEATURES_KEY = "enabled-features";

export type FeatureList = Record<string, Omit<Feature, "isEnabled" | "name">>;

export type DefinedFeatures = keyof typeof features;

export type Feature = {
	name: keyof typeof features;
	icon: string;
	title: {
		ru: string;
		en: string;
	};
	desc?: {
		ru: string;
		en: string;
	};
	url?: string;
	status?: "in-dev" | "experimental" | "unstable" | "beta";
	isEnabled: boolean;
	targets: FeatureTarget;
};

let cachedFeatures: Record<string, Feature> = null;

const loadFeatures = () => {
	const feats = { ...features };

	const enabled = typeof window !== "undefined" ? window.localStorage?.getItem(FEATURES_KEY) : null;
	const enabledFeatures = enabled?.split(",").filter((name) => feats[name as keyof typeof feats]) || [];

	cachedFeatures = Object.fromEntries(
		Object.entries(feats)
			.filter(([, feature]) => feature.targets & target[getExecutingEnvironment()])
			.map(([name, feature]) => [
				name,
				{
					...feature,
					name: name as keyof typeof features,
					icon: feature.icon || "zap",
					isEnabled: enabledFeatures.includes(name),
				},
			]),
	);
};

export const getFeatureList = () => {
	return Object.values(cachedFeatures);
};

export const getEnabledFeatures = () => {
	return Object.values(cachedFeatures).filter((feature) => feature.isEnabled);
};

export const setFeature = (name: keyof typeof features, value: boolean) => {
	assert(cachedFeatures[name], `Feature ${name} not found`);
	cachedFeatures[name].isEnabled = value;

	const enabledFeatureNames = Object.keys(cachedFeatures).filter(
		(featureName) => cachedFeatures[featureName].isEnabled,
	);
	typeof window !== "undefined" && window.localStorage?.setItem(FEATURES_KEY, enabledFeatureNames.join(","));
};

const target: Record<ReturnType<typeof getExecutingEnvironment>, FeatureTarget> = {
	browser: FeatureTarget.web,
	tauri: FeatureTarget.desktop,
	next: FeatureTarget.static,
	test: FeatureTarget.all,
	static: FeatureTarget.all,
	cli: FeatureTarget.all,
};

export const feature = (name: keyof typeof features): boolean => {
	return cachedFeatures[name]?.isEnabled || false;
};

export const features = {
	cloud: {
		title: {
			ru: "Облако",
			en: "Cloud",
		},
		desc: {
			ru: "Опубликуйте портал для читателей за несколько кликов",
			en: "Publish a docportal for readers in a few clicks",
		},
		url: "https://gram.ax/resources/docs/doc-portal/cloud-gramax",
		icon: "cloud",
		targets: FeatureTarget.web | FeatureTarget.desktop,
	},
	"filtered-catalog": {
		title: {
			ru: "Фильтрация каталога",
			en: "Filtered Catalog",
		},
		desc: {
			ru: "Создайте разные сборки документации из одного каталога",
			en: "Create a various docs builds from single catalog",
		},
		url: "https://gram.ax/resources/docs/catalog/filter",
		icon: "filter",
		targets: FeatureTarget.web | FeatureTarget.desktop | FeatureTarget.static,
	},
} as const satisfies FeatureList;

loadFeatures();
