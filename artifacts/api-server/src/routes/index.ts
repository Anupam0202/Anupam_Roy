import { Router, type IRouter } from "express";
import type { Deps } from "../lib/deps";
import { createProviderClient } from "../lib/providers";
import { createAiRouter, createGeminiModelChoice } from "./ai";
import { createCitationsRouter } from "./citations";
import { createClientErrorRouter } from "./client-error";
import { createContactRouter } from "./contact";
import { createHealthRouter } from "./health";
import { createPackagesRouter } from "./packages";
import { createRepositoryRouter } from "./repository";

export function createApiRouter(deps: Deps): IRouter {
  const providers = createProviderClient(deps);
  // Shared so /api/status reports the model Ask the Atlas is actually using.
  const models = createGeminiModelChoice(deps.env);
  const router = Router();
  router.use(createHealthRouter(deps, providers, models));
  router.use(createRepositoryRouter(deps, providers));
  router.use(createCitationsRouter(deps, providers));
  router.use(createPackagesRouter(deps, providers));
  router.use(createAiRouter(deps, providers, models));
  router.use(createContactRouter(deps, providers));
  router.use(createClientErrorRouter(deps));
  return router;
}
