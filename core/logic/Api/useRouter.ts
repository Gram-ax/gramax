import resolveModule from "@app/resolveModule";
import localizer from "../../extensions/localization/core/Localizer";
import { Router } from "./Router";

const rules = [localizer.sanitizePrefix.bind(localizer)];

export const useRouter = (): Router => resolveModule("Router").use(rules);
