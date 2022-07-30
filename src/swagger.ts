import "reflect-metadata";
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
import { join } from "path";
const METAKEY_PROPERTY = "definition";

export function createSwaggerDoc(
  app: Application,
  options: TySwaggerUserOptions
) {
  const paths: PickItem<TySwaggerInternalOptions, "paths"> = {};
  const definitions: PickItem<TySwaggerInternalOptions, "definitions"> = {};
  function callback(router: any, base: string) {
    router.stack.forEach((layer: any) => {
      if (layer.name === "router") {
        const match = (layer.regexp as RegExp).source.match(/^\^\\(.*?)\\/);
        if (match) {
          const prefix = match[1];
          callback(layer.handle, join(base, prefix));
        }
      } else if (layer.route) {
        const lay = layer.route.stack.find((lay: any) => lay.handle.__data__);
        if (!lay) {
          return;
        }
        const routeOptions = lay.handle.__data__ as RouteSwaggerOptions;
        // express和swagger处理url为path类型时的方式不同
        const path = join(base, layer.route.path as string)
          .split("/")
          .map((str) => {
            if (str.includes(":")) {
              str = str.replace(":", "{");
              str = str + "}";
            }
            return str;
          })
          .join("/");
        const method = Object.keys(layer.route.methods)[0] as HttpMethod;
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
        if (routeOptions.parameter && httpConfig) {
          const parameter = routeOptions.parameter;
          httpConfig.parameters = [];
          const properties = Reflect.getMetadata(
            METAKEY_PROPERTY,
            parameter.dto
          ) as Record<string, DefineProperty>;
          definitions[parameter.dto.name] = {
            type: "object",
            properties,
          };
          const { dto, ...param } = parameter;
          if (parameter.in === "body") {
            httpConfig.parameters.push({
              ...param,
              schema: {
                $ref: `#/definitions/${parameter.dto.name}`,
              },
              name: dto.name,
            });
          } else {
            for (const key of Object.keys(properties)) {
              httpConfig.parameters.push({
                name: key,
                in: parameter.in,
                ...properties[key],
              });
            }
          }
        }
        // responses
        if (routeOptions.responses && httpConfig) {
          const responses = routeOptions.responses;
          httpConfig.responses = {};
          Object.keys(responses).forEach((status) => {
            const response = responses[status];
            const properties = Reflect.getMetadata(
              METAKEY_PROPERTY,
              response.dto
            ) as Record<string, DefineProperty>;
            definitions[response.dto.name] = {
              type: "object",
              properties,
            };
            const { dto, ...res } = response;
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
  }
  callback(app._router, "");
  const doc: TySwaggerDoc = {
    ...options,
    paths,
    definitions,
  };
  return doc;
}

interface RouteSwaggerOptions
  extends Omit<HttpConfig, "parameters" | "responses"> {
  parameter?: { dto: { new (): {} } } & Omit<Param, "schema" | "type" | "name">;
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

export function ApiProperty(
  defineProperty: Omit<DefineProperty, "properties">
) {
  return function (prototype: any, propKey: string) {
    const item = Reflect.getMetadata(
      METAKEY_PROPERTY,
      prototype.constructor
    ) as Record<string, DefineProperty> | undefined;
    const property: DefineProperty = {
      ...defineProperty,
    };
    // 检查是否有嵌套情况
    const subDto = Reflect.getMetadata("design:type", prototype, propKey);
    const subProperties = Reflect.getMetadata(METAKEY_PROPERTY, subDto);
    if (subProperties) {
      property.properties = subProperties;
    }
    if (item) {
      item[propKey] = property;
    } else {
      const metaItem: Record<string, DefineProperty> = {
        [propKey]: property,
      };
      Reflect.defineMetadata(METAKEY_PROPERTY, metaItem, prototype.constructor);
    }
  };
}
