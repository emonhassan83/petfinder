import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

//* Validates req.body, req.query and req.params against `schema` ({ body?, query?, params? }).
//* Parsed values replace the originals for the keys the schema defines, so unknown fields are
//* stripped and coercions (e.g. query numbers) apply. Errors go to the global handler (400).
const validateRequest = (schema: ZodObject<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed: any = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    const shape = schema.shape as Record<string, unknown>;
    if ("body" in shape) req.body = parsed.body;
    if ("query" in shape) {
      //* Express 4 allows reassigning req.query; define it to stay safe on newer versions
      Object.defineProperty(req, "query", { value: parsed.query ?? {}, writable: true, configurable: true, enumerable: true });
    }
    if ("params" in shape) req.params = parsed.params ?? {};
    return next();
  } catch (err) {
    next(err);
  }
};

export default validateRequest;
