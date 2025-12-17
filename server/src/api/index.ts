// starts the server and listens for connections

import { createServer } from "http"
import { createApp } from "./app"
import { serveViteDev } from "../infra/frontend/viteDev";
import { serveStatic } from "../infra/frontend/serveStatic";

// start schedulers
emailScheduler.start();
newsScheduler.start();

const app = await createApp();
const server = createServer(app);

if (process.env.NODE_ENV === "production") {
    serveStatic(app);
} else {
    await serveViteDev(server, app);
}

const port = parseInt(process.env.PORT || "5000", 10)

server.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    console.log(`serving on port ${port}`)
  }
);