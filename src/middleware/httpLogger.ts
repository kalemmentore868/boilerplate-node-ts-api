import morgan from "morgan";
import type { Request } from "express";

morgan.token("id", (req: Request) => req.id);

const devFormat = ":id :method :url :status :response-time ms";
const prodFormat =
  'id=:id ip=:remote-addr method=:method path=:url status=:status bytes=:res[content-length] rt=:response-time ms ua=":user-agent"';

export const httpLogger = morgan(
  process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  {
    skip: () => process.env.NODE_ENV === "test", // keep tests clean
  }
);
