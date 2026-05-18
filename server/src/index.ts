import "dotenv/config";
import app, { db, logger } from "./app";
import { toLogError } from "./utils/logging";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function start(): Promise<void> {
  await db.init();

  app.listen(PORT, () => {
    logger.info("Server", `Running at http://localhost:${PORT}/api`);
  });
}

start().catch((err) => logger.error("Server", "Fatal startup error", toLogError(err instanceof Error ? err : String(err))));
