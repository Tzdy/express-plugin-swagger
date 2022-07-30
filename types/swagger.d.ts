declare namespace TySwagger {
  type PickItem<T, K extends keyof T> = T[K];
  // 被选中的属性集合，变成required状态
  type Sure<T, K extends keyof T> = { [P in K]-?: T[P] } & Omit<T, K>;
  type Prototype<T> = { constructor: T } & Object;

  type ParamType = "query" | "path" | "body" | "header" | "formData";
  type DataType =
    | "integer"
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object";
  type HttpMethod = "get" | "post" | "put" | "delete" | "patch";
  type DefinitionType = "object"; // 目前只处理对象类型
  type TagItem = {
    name: string;
    description?: string;
  };
  type Schema = {
    $ref: string;
  };
  type SecurityType = {
    basic: "basic";
    apiKey: "apiKey";
    oauth2: "oauth2";
  };

  type DefineProperty = {
    type: DataType;
    example?: any;
    format?: string; // 先不用
    properties?: Record<string, DefineProperty>; // 如果type不是object类型，这个可以为空
  };

  type Param = {
    name: string;
    in: ParamType;
    type?: DataType;
    description?: string;
    schema?: Schema;
    required?: boolean;
  };

  type Response = {
    schema?: Schema;
    description?: string;
  };

  type HttpConfig = {
    tags?: Array<string>;
    description?: string;
    summary?: string;
    consumes?: Array<string>;
    produces?: Array<string>;
    parameters?: Array<Param>;
    responses?: Record<string, Response>;
    security?: Array<Record<string, Array<string>>>;
  };

  type SecurityBasic = {
    type: PickItem<SecurityType, "basic">;
    scopes?: Record<string, string>;
  };

  type SecurityApiKey = {
    type: PickItem<SecurityType, "apiKey">;
    name?: string;
    in?: ParamType; // 不写的话默认header
    scopes?: Record<string, string>;
  };

  type SecurityOAuth2 = {
    type: PickItem<SecurityType, "oauth2">;
    authorizationUrl: string;
    flow: string;
    tokenUrl: string;
    scopes?: Record<string, string>;
  };

  type DefinitionItem = {
    type: DefinitionType;
    example?: any;
    format?: string; // 先不用
    properties: Record<string, DefineProperty>;
  };

  interface TySwaggerUserOptions {
    swagger: "2.0";
    host: string;
    basePath: string;
    info?: {
      description: string;
      version: string;
      title: string;
      contact?: {
        email?: string;
      };
    };
    tags?: Array<TagItem>;
    schemes?: Array<string>;
    security?: Array<Record<string, Array<string>>>; // 全局安全策略，可以被局部覆盖。
    securityDefinitions?: Record<
      string,
      SecurityBasic | SecurityApiKey | SecurityOAuth2
    >;
  }

  // 内部定义的，在contants中强制赋值。
  interface TySwaggerInternalOptions {
    paths: Record<string, { [key in HttpMethod]?: HttpConfig }>;
    definitions: Record<string, DefinitionItem>;
  }

  interface PluginOptions {
    url: string;
  }

  interface Options extends TySwaggerUserOptions, PluginOptions {}

  interface TySwaggerDoc
    extends TySwaggerUserOptions,
      TySwaggerInternalOptions {}

  // Decorator

  interface PropertyOptions extends DefineProperty {
    required?: boolean;
  }
}
export = TySwagger;
