import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

type ErrorBody = {
  message?: string | string[];
  issues?: Array<{ path: unknown; message: string }>;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const logger = new Logger(ApiExceptionFilter.name);

    if (!response || !request) {
      throw exception;
    }

    const headerValue = request?.headers?.["x-request-id"];
    const requestId = typeof headerValue === "string" && headerValue.trim().length > 0
      ? headerValue.trim()
      : randomUUID();

    response.setHeader("x-request-id", requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let details: NonNullable<ErrorBody["issues"]> = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const resolved = body as ErrorBody;
        message = resolved.message ? String(resolved.message) : "Request failed";

        if (Array.isArray(resolved.issues)) {
          resolved.issues.forEach((issue) => {
            details.push({
              path: issue.path,
              message: issue.message,
            });
          });
        }
      } else {
        message = "Request failed";
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.error(
        `requestId=${requestId}, method=${request?.method ?? "UNKNOWN"}, path=${request?.url ?? "UNKNOWN"}, status=${status}, error=${message}`,
      );

      if (process.env.NODE_ENV !== "production" && exception instanceof Error && exception.stack) {
        details.push({
          path: ["stack"],
          message: exception.stack,
        });
      }

      message = "요청 처리 중 내부 오류가 발생했습니다.";
      if (!details.length) {
        details.push({
          path: ["internal"],
          message: "서버 로그를 확인해 주세요.",
        });
      } else {
        details = [];
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}
