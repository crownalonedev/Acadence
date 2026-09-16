import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function createStore(file) {
  let state = { version: 1, activeScope: null, accounts: {} };
  try {
    state = JSON.parse(await readFile(file, "utf8"));
    if (state.version !== 1 || !state.accounts)
      throw new Error("Unsupported connector store.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let queue = Promise.resolve();
  return {
    read: () => state,
    // Serialize syncs and reads. Publish memory only after atomic persistence.
    transact(update) {
      const operation = queue.then(async () => {
        const next = structuredClone(state);
        const result = update(next);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(`${file}.tmp`, JSON.stringify(next), { mode: 0o600 });
        await rename(`${file}.tmp`, file);
        state = next;
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
