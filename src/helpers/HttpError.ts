class HttpError extends Error {
  status: number;
  constructor(status: number, message = messages[status] || messages.default) {
    super(message);
    this.status = status;
  }
}

const messages: Record<number | "default", string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  default: "Internal Server Error",
};

export default HttpError;
