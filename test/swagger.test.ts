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

    const app = express();
    const router = Router();
    const deepRouter = Router();
    const nonePrefixRouter = Router();
    router.use("/deep", deepRouter);
    router.use(nonePrefixRouter);
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
            description: "如果成功就返回。",
          },
          "400": {
            dto: B,
            description: "账号或密码输入错误",
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
            description: "如果成功就返回。",
          },
          "400": {
            dto: B,
            description: "账号或密码输入错误",
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
            description: "如果成功就返回。",
          },
          "400": {
            dto: B,
            description: "账号或密码输入错误",
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

    const swaggerDocument = createSwaggerDoc(app, {
      swagger: "2.0",
      tags: [
        {
          name: "test",
          description: "测试用tag",
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
      tags: [{ name: "test", description: "测试用tag" }],
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
        "/get/{id}": {
          get: {
            tags: ["test"],
            parameters: [{ name: "id", in: "path", type: "string" }],
            responses: {
              "200": {
                description: "如果成功就返回。",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "账号或密码输入错误",
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
                description: "如果成功就返回。",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "账号或密码输入错误",
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
                description: "如果成功就返回。",
                schema: { $ref: "#/definitions/B" },
              },
              "400": {
                description: "账号或密码输入错误",
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
      },
    };
    expect(swaggerDocument).toEqual(result);
    app.use("/v2", SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));
    app.listen(10024);
  });
});
