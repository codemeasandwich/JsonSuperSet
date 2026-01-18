export interface PluginConfig {
  check: (key: string | number, value: any) => boolean;
  encode: (path: string[], key: string | number, value: any, context: object) => any;
  decode: (value: any, path: string[], context: object) => any;
  onSend?: (path: string[], key: string | number, value: any, context: object) => { replace: any; cleanup?: () => void };
  onReceive?: (path: string[], key: string | number, value: any, context: object) => Promise<any>;
}

export function stringify(obj: any): string;
export function parse(encoded: string): any;
export function encode(obj: any): object;
export function decode(data: object): any;
export function custom(tag: string, config: PluginConfig): void;
export function clearPlugins(): void;
