import "reflect-metadata";
import express, { Router } from "express";
import { ApiProperty, ExpressSwagger, createSwaggerDoc } from "@/swagger";
import SwaggerUI from "swagger-ui-express";
describe("swagger", () => {
  it("generate swaggerDoc", () => {
    class A {
      @ApiProperty({
        type: "string",
      })
      id: string = "";
    }

    class Data {
      @ApiProperty({
        type: "string",
      })
      token: string;
    }

    class B {
      @ApiProperty({
        type: "string",
      })
      resText: string = "";
    }

    class C {
      @ApiProperty({
        type: "string",
      })
      resText: string = "";

      @ApiProperty({
        type: "object",
        ref: Data,
      })
      data: Data;
    }

    class ArrayDto {
      @ApiProperty({
        type: "array",
        items: {
          type: "object",
          ref: B,
        },
      })
      array: Array<B>;
    }

    class ArrayStringDto {
      @ApiProperty({
        type: "array",
        items: {
          type: "string",
        },
      })
      array: Array<string>;
    }

    class ArrayDeepDto {
      @ApiProperty({
        type: "array",
        items: {
          type: "array",
          items: {
            type: "object",
            ref: B,
          },
        },
      })
      array: Array<Array<B>>;
    }

    class SuperDto {
      @ApiProperty({
        type: "number",
      })
      type: number = 1;
    }

    class SuperSubDto extends SuperDto {
      @ApiProperty({
        type: "number",
      })
      code: number = 100;
    }

    class SubDto extends SuperSubDto {
      @ApiProperty({
        type: "string",
      })
      message: string;
    }

    class EmptyDto {}

    const app = express();
    const router = Router();
    const deepRouter = Router();
    const nonePrefixRouter = Router();
    const superRouter = Router();
    router.use("/deep", deepRouter);
    router.use(nonePrefixRouter);
    router.use("/super", superRouter);
    app.use("/api", router);
    deepRouter.get(
      "/info",
      ExpressSwagger({
        tags: ["test"],
        parameter: {
          in: "body",
          dto: A,
        },
        responses: {
          "200": {
            dto: B,
            description: "????????????????????????",
          },
          "400": {
            dto: B,
            description: "???????????????????????????",
          },
          "401": {
            dto: ArrayDto,
          },
          "402": {
            dto: ArrayStringDto,
          },
          "403": {
            dto: ArrayDeepDto,
          },
        },
      })
    );

    app.get(
      "/get/:id",
      ExpressSwagger({
        tags: ["test"],
        parameter: {
          in: "path",
          dto: A,
        },
        responses: {
          "200": {
            dto: B,
            description: "????????????????????????",
          },
          "400": {
            dto: B,
            description: "???????????????????????????",
          },
          "401": {
            dto: C,
          },
        },
      }),
      async (req, res) => {
        res.send({
          resText: req.params.id,
        });
      }
    );

    app.get(
      "/empty",
      ExpressSwagger({
        tags: ["test"],
        parameter: {
          in: "query",
          dto: EmptyDto,
        },
        responses: {
          200: {
            dto: EmptyDto,
          },
        },
      })
    );

    nonePrefixRouter.get(
      "/get/:id",
      ExpressSwagger({
        tags: ["test"],
        parameter: {
          in: "path",
          dto: A,
        },
        responses: {
          "200": {
            dto: B,
            description: "????????????????????????",
          },
          "400": {
            dto: B,
            description: "???????????????????????????",
          },
          "401": {
            dto: C,
          },
        },
      }),
      async (req, res) => {
        res.send({
          resText: req.params.id,
        });
      }
    );

    superRouter.post(
      "/super",
      ExpressSwagger({
        parameter: {
          in: "body",
          dto: SubDto,
        },
        responses: {
          "200": {
            dto: SubDto,
          },
        },
      })
    );

    const swaggerDocument = createSwaggerDoc(app, {
      swagger: "2.0",
      tags: [
        {
          name: "test",
          description: "?????????tag",
        },
      ],
      info: {
        description: "This is a sample server Petstore server.",
        version: "1.0.0",
        title: "Swagger Petstore",
        contact: {
          email: "apiteam@swagger.io",
        },
      },
      host: "localhost:3001",
      basePath: "/",
      security: [
        {
          basic: [],
          api_key: [],
        },
      ],
      securityDefinitions: {
        basic: {
          type: "basic",
        },
        api_key: {
          type: "apiKey",
          in: "header",
          name: "token",
        },
      },
    });
    const result = {
      swagger: "2.0",
      tags: [{ name: "test", description: "?????????tag" }],
      info: {
        description: "This is a sample server Petstore server.",
        version: "1.0.0",
        title: "Swagger Petstore",
        contact: { email: "apiteam@swagger.io" },
      },
      host: "localhost:3001",
      basePath: "/",
      security: [{ basic: [], api_key: [] }],
      securityDefinitions: {
        basic: { type: "basic" },
        api_key: { type: "apiKey", in: "header", name: "token" },
      },
      paths: {
        "/api/super/super": {
          post: {
            parameters: [
              {
                name: "SubDto",
                in: "body",
                schema: { $ref: "#/definitions/SubDto" },
              },
            ],
            responses: {
              200: {
                schema: { $ref: "#/definitions/SubDto" },
              },
            },
          },
        },
        "/empty": {
          get: {
            tags: ["test"],
            parameters: [],
            responses: {
              200: {
                schema: { $ref: "#/definitions/EmptyDto" },
              },
            },
          },
        },
        "/get/{id}": {
          get: {
            tags: ["test"],
            parameters: [{ name: "id", in: "path", type: "string" }],
            responses: {
              "200": {
                description: "????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "???????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "401": {
                schema: { $ref: "#/definitions/C" },
              },
            },
          },
        },
        "/api/deep/info": {
          get: {
            tags: ["test"],
            parameters: [
              { name: "A", in: "body", schema: { $ref: "#/definitions/A" } },
            ],
            responses: {
              "200": {
                description: "????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "???????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "401": {
                schema: { $ref: "#/definitions/ArrayDto" },
              },
              "402": {
                schema: { $ref: "#/definitions/ArrayStringDto" },
              },
              "403": {
                schema: { $ref: "#/definitions/ArrayDeepDto" },
              },
            },
          },
        },
        "/api/get/{id}": {
          get: {
            tags: ["test"],
            parameters: [{ name: "id", in: "path", type: "string" }],
            responses: {
              "200": {
                description: "????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "???????????????????????????",
                schema: { $ref: "#/definitions/B" },
              },
              "401": {
                schema: { $ref: "#/definitions/C" },
              },
            },
          },
        },
      },
      definitions: {
        SubDto: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
            type: {
              type: "number",
            },
            code: {
              type: "number",
            },
          },
        },
        A: {
          type: "object",
          properties: { id: { type: "string" } },
        },
        B: {
          type: "object",
          properties: { resText: { type: "string" } },
        },
        C: {
          type: "object",
          properties: {
            resText: { type: "string" },
            data: {
              type: "object",
              properties: { token: { type: "string" } },
            },
          },
        },
        ArrayDto: {
          type: "object",
          properties: {
            array: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resText: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        ArrayStringDto: {
          type: "object",
          properties: {
            array: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        ArrayDeepDto: {
          type: "object",
          properties: {
            array: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    resText: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
        EmptyDto: {
          type: "object",
          properties: {},
        },
      },
    };
    expect(swaggerDocument).toEqual(result);
    app.use("/v2", SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));
    app.listen(10024);
  });
});
