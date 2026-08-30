import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestValidationSchema = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export function validate(schema: RequestValidationSchema) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const body = schema.body?.safeParse(request.body);
    const params = schema.params?.safeParse(request.params);
    const query = schema.query?.safeParse(request.query);

    const errors = [body, params, query]
      .filter((result) => result && !result.success)
      .map((result) => (result && !result.success ? result.error.flatten() : undefined))
      .filter((error) => error !== undefined);

    if (errors.length > 0) {
      response.status(400).json({
        success: false,
        error: errors
      });
      return;
    }

    if (body?.success) {
      request.body = body.data;
    }

    if (params?.success) {
      request.params = params.data;
    }

    if (query?.success) {
      request.query = query.data;
    }

    next();
  };
}

export function validateBody(schema: ZodType) {
  return validate({ body: schema });
}
