import { app } from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";
import http from "http";
import { initSockets } from "./sockets/";

const bootstrap = async () => {
  try {
    const server = http.createServer(app);

    initSockets(server);

    await connectDB();

    server.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start app:", err);
    process.exit(1);
  }
};

bootstrap();
