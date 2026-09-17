import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

const port = Number(process.env.PORT || 8787);
const storeFile =
  process.env.ACADENCE_STORE_PATH ||
  fileURLToPath(new URL("../data/connector.json", import.meta.url));
const store = await createStore(storeFile);
createApp(store).listen(port, () =>
  console.log(`Acadence server listening on http://localhost:${port}`),
);
