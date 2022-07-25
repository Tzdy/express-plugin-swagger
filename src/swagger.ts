import 'reflect-metadata'
import { Application, Request, Response, NextFunction } from "express";
import TySwagger, {
  DefineProperty,
  HttpConfig,
  HttpMethod,
  Param,
  PickItem,
  TySwaggerDoc,
  TySwaggerInternalOptions,
  TySwaggerUserOptions,
} from "../types/swagger";
const METAKEY_DEFINITION = "definition";

export function createSwaggerDoc(
  app: Application,
  options: TySwaggerUserOptions
) {
  const paths: PickItem<TySwaggerInternalOptions, "paths"> = {};
  const definitions: PickItem<TySwaggerInternalOptions, "definitions"> = {};

  app._router.stack.forEach(function (r: any) {
    if (r.route && r.route.path) {
      const layer = r.route.stack.find((item: any) => item.handle.__data__);
      if (!layer) {
        return;
      }
      const routeOptions = layer.handle.__data__ as RouteSwaggerOptions;
      // express和swagger处理url为path类型时的方式不同
      const path = (r.route.path as string)
        .split("/")
        .map((str) => {
          if (str.includes(":")) {
            str = str.replace(":", "{");
            str = str + "}";
          }
          return str;
        })
        .join("/");
      const method = Object.keys(r.route.methods)[0] as HttpMethod;
      const httpConfigMap = paths[path] ? paths[path] : (paths[path] = {});
      const httpConfig = (
        httpConfigMap[method]
          ? httpConfigMap[method]
          : (httpConfigMap[method] = {})
      ) as HttpConfig;

      routeOptions.consumes && (httpConfig.consumes = routeOptions.consumes);
      routeOptions.description &&
        (httpConfig.description = routeOptions.description);
      routeOptions.produces && (httpConfig.produces = routeOptions.produces);
      routeOptions.security && (httpConfig.security = routeOptions.security);
      routeOptions.summary && (httpConfig.summary = routeOptions.summary);
      routeOptions.tags && (httpConfig.tags = routeOptions.tags);
      // parameters
      if (routeOptions.parameters && httpConfig) {
        const parameters = routeOptions.parameters;
        httpConfig.parameters = [];
        parameters.forEach((parameter, index) => {
          const properties = Reflect.getMetadata(
            METAKEY_DEFINITION,
            parameter.dto
          ) as Record<string, DefineProperty>;
          definitions[parameter.dto.name] = {
            type: "object",
            required: [],
            properties,
          };
          const { dto, ...param } = parameter 
          httpConfig.parameters![index] = {
            ...param,
            schema: {
              $ref: `#/definitions/${parameter.dto.name}`,
            },
          };
          
        });
      }
      // responses
      if (routeOptions.responses && httpConfig) {
        const responses = routeOptions.responses;
        httpConfig.responses = {};
        Object.keys(responses).forEach((status) => {
          const response = responses[status];
          const properties = Reflect.getMetadata(
            METAKEY_DEFINITION,
            response.dto
          ) as Record<string, DefineProperty>;
          definitions[response.dto.name] = {
            type: "object",
            required: [],
            properties,
          };
          const { dto, ...res } = response 
          httpConfig.responses![status] = {
            ...res,
            schema: {
              $ref: `#/definitions/${response.dto.name}`,
            },
          };
        });
      }
    }
  });
  const doc: TySwaggerDoc = {
    ...options,
    paths,
    definitions,
  };
  return doc;
}

interface RouteSwaggerOptions extends HttpConfig {
  parameters?: Array<{ dto: { new (): {} } } & Omit<Param, "schema">>;
  responses?: Record<
    string,
    { dto: { new (): {} } } & Omit<TySwagger.Response, "schema">
  >;
}

export function ExpressSwagger(options: RouteSwaggerOptions) {
  function ExpressSwaggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    next();
  }
  ExpressSwaggerMiddleware["__data__"] = options;
  return ExpressSwaggerMiddleware;
}

export function ApiProperty(defineProperty: DefineProperty) {
  return function (prototype: any, propKey: string) {
    const item = Reflect.getMetadata(
      METAKEY_DEFINITION,
      prototype.constructor
    ) as Record<string, DefineProperty> | undefined;
    if (item) {
      item[propKey] = defineProperty;
    } else {
      const metaItem: Record<string, DefineProperty> = {
        [propKey]: defineProperty,
      };
      Reflect.defineMetadata(
        METAKEY_DEFINITION,
        metaItem,
        prototype.constructor
      );
    }
  };
}
