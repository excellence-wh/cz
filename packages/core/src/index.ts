export { generate, initGit, installDependencies } from "./generate.ts";
export { loadTemplate, loadTemplates } from "./templates.ts";
export type {
  GenerateOptions,
  GenerateResult,
  PackageManager,
  Template,
  TemplateKind,
  TemplateManifest,
} from "./types.ts";
export {
  defaultVariables,
  render,
  renderPath,
  toPackageName,
  toTitle,
} from "./variables.ts";
