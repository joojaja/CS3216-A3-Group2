import { removeBackground } from "./imgly-background-removal.mjs";

const pending = [];
const cancelled = new Set();
let working = false;

self.addEventListener("message", (event) => {
  if (event.data.type === "cancel") {
    cancelled.add(event.data.id);
    return;
  }

  pending.push(event.data);
  void runNext();
});

async function runNext() {
  if (working) return;
  working = true;

  while (pending.length > 0) {
    const job = pending.shift();
    if (!job || cancelled.delete(job.id)) continue;

    try {
      const result = await removeBackground(job.file, {
        model: "isnet_quint8",
        output: { format: "image/png" },
        progress: (_key, loaded, total) => {
          if (!cancelled.has(job.id)) {
            self.postMessage({ type: "progress", id: job.id, loaded, total });
          }
        },
      });

      if (!cancelled.delete(job.id)) {
        self.postMessage({ type: "done", id: job.id, result });
      }
    } catch (error) {
      if (!cancelled.delete(job.id)) {
        self.postMessage({
          type: "error",
          id: job.id,
          message: error instanceof Error ? error.message : "Background removal failed",
        });
      }
    }
  }

  working = false;
}
