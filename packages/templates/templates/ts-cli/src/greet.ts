export interface GreetOptions {
  /** 要问候的名字，默认 `world` */
  name?: string;
  /** 是否使用感叹号，默认 true */
  excited?: boolean;
}

/** 生成一句问候语。 */
export function greet(options: GreetOptions = {}): string {
  const name = options.name?.trim() || "world";
  const punctuation = options.excited === false ? "." : "!";
  return `Hello, ${name}${punctuation}`;
}
