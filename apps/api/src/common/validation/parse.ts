import { BadRequestException } from "@nestjs/common";
import type { ZodIssue, ZodTypeAny } from "zod";

type ValidationInput<T> = unknown;

export class ValidationError {
  constructor(
    public readonly path: string[],
    public readonly message: string,
  ) {}
}

export function parseBody<T extends ZodTypeAny>(schema: T, value: ValidationInput<T>): ReturnType<T["parse"]> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException({
      message: "Invalid request body",
      issues: result.error.issues.map((issue: ZodIssue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  return result.data;
}
