import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";

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

    if (!response || !request) {
      throw exception;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    const details: ErrorBody["issues"] = [];

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
      if (exception instanceof BadRequestException) {
        status = HttpStatus.BAD_REQUEST;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV !== "production") {
      details.push({ path: ["internal"], message });
      message = new InternalServerErrorException().message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}

