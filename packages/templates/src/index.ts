import { fileURLToPath } from "node:url";

/**
 * 模板根目录。
 *
 * 该文件构建前位于 `src/`、构建后位于 `dist/`，两者都是 `templates/` 的兄弟目录，
 * 因此 `../templates` 在开发态与发布态都指向 `<包根>/templates`。
 */
export const templatesDir: string = fileURLToPath(new URL("../templates", import.meta.url));
