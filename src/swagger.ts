import "reflect-metadata";
import { Application, Request, Response, NextFunction } from "express";
import TySwagger, {
  DefineProperty,
  DefinePropertyOptions,
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
        const match = (layer.regexp as RegExp).source.match(
          /^\^\\{0,1}(.*?)\\\/{0,1}\?\(\?\=/
        );
        if (match) {
          const prefix = match[1].replace(/\\/g, "");
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
          const properties =
            (Reflect.getMetadata(METAKEY_PROPERTY, parameter.dto) as Record<
              string,
              DefineProperty
            >) || {};
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
            const properties =
              (Reflect.getMetadata(METAKEY_PROPERTY, response.dto) as Record<
                string,
                DefineProperty
              >) || {};
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

export function ApiProperty(defineProperty: DefinePropertyOptions) {
  return function (prototype: any, propKey: string) {
    const item = Reflect.getMetadata(
      METAKEY_PROPERTY,
      prototype.constructor
    ) as Record<string, DefineProperty> | undefined;
    // items: __items, ref: __ref，这么写是为了排除items, ref两个属性，没有别的意思。
    const { items: __items, ref: __ref, ...__property } = defineProperty;
    const property: DefineProperty = __property;
    // 如果是对象类型检查是否有嵌套情况
    if (defineProperty.type === "object") {
      const subDto = defineProperty.ref;
      if (subDto) {
        const subProperties = Reflect.getMetadata(METAKEY_PROPERTY, subDto);
        if (subProperties) {
          property.properties = subProperties;
        }
      }
    } else if (defineProperty.type === "array") {
      let items = defineProperty.items;
      let loop_property = property;
      while (items) {
        // items: __items, ref: __ref，这么写是为了排除items, ref两个属性，没有别的意思
        const { items: __items, ref: __ref, ...__property } = items;
        loop_property.items = {
          ...__property,
        };
        if (items.type === "object") {
          const subDto = items.ref;
          if (subDto) {
            const subProperties = Reflect.getMetadata(METAKEY_PROPERTY, subDto);
            if (subProperties) {
              loop_property.items.properties = subProperties;
            }
          }
        }
        items = items.items;
        loop_property = loop_property.items;
      }
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
