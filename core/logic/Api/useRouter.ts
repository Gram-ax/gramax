import resolveModule from "@app/resolveModule/frontend";
import { Router } from "./Router";
import Localizer from "@ext/localization/core/Localizer";

const rules = [Localizer.sanitize.bind(Localizer)];

export const useRouter = (): Router => resolveModule("Router").use(rules);
