import { app } from "./app";
import { env } from "./env";

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log(`Server listening in http://localhost:${env.PORT}`);
  });
