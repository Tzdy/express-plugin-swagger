import "reflect-metadata";
import express, { Router } from "express";
import { ApiProperty, ExpressSwagger, createSwaggerDoc } from "@/swagger";
describe("swagger", () => {
  it("generate swaggerDoc", () => {
    class A {
      @ApiProperty({
        type: "string",
      })
      id: string = "";
    }

    class B {
      @ApiProperty({
        type: "string",
      })
      resText: string = "";
    }

    const app = express();
    const router = Router();
    const deepRouter = Router();
    router.use("/api", deepRouter);
    app.use(router);
    deepRouter.get(
      "/info",
      ExpressSwagger({
        tags: ["test"],
        parameters: [
          {
            name: "id",
            in: "path",
            dto: A,
          },
        ],
        responses: {
          "200": {
            dto: B,
            description: "如果成功就返回。",
          },
          "400": {
            dto: B,
            description: "账号或密码输入错误",
          },
        },
      })
    );

    app.get(
      "/get/:id",
      ExpressSwagger({
        tags: ["test"],
        parameters: [
          {
            name: "id",
            in: "path",
            dto: A,
          },
        ],
        responses: {
          "200": {
            dto: B,
            description: "如果成功就返回。",
          },
          "400": {
            dto: B,
            description: "账号或密码输入错误",
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
            parameters: [
              { name: "id", in: "path", schema: { $ref: "#/definitions/A" } },
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
            },
          },
        },
        "/api/info": {
          get: {
            tags: ["test"],
            parameters: [
              { name: "id", in: "path", schema: { $ref: "#/definitions/A" } },
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
            },
          },
        },
      },
      definitions: {
        A: {
          type: "object",
          required: [],
          properties: { id: { type: "string" } },
        },
        B: {
          type: "object",
          required: [],
          properties: { resText: { type: "string" } },
        },
      },
    };
    expect(swaggerDocument).toEqual(result);
  });
});
