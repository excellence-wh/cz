#!/usr/bin/env node
import { parseArgs } from "node:util";
import { greet } from "./greet.ts";

const HELP = `{{name}} — {{description}}

用法:
  {{name}} [选项] [名字...]

选项:
  -n, --name <name>   要问候的名字
  -q, --quiet         不带感叹号
  -h, --help          显示帮助
  -v, --version       显示版本
`;

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      name: { type: "string", short: "n" },
      quiet: { type: "boolean", short: "q" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (values.version) {
    process.stdout.write("0.1.0\n");
    return 0;
  }

  const name = values.name ?? positionals.join(" ");
  process.stdout.write(`${greet({ name, excited: values.quiet !== true })}\n`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
