"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AnalysisProvider,
  CHECKLIST,
  useAnalysis,
} from "@/components/analysis-context";
import { ItemUploader } from "@/components/item-uploader";
import { useToast } from "@/components/toast";

const MAX_JOBS = 2;

export type JobSnapshot = {
  preview: string | null;
  status: string;
  progress: number;
  working: boolean;
  hasFile: boolean;
  canRemove: boolean;
};

const waiting: JobSnapshot = {
  preview: null,
  status: "Waiting for a photo",
  progress: 0,
  working: false,
  hasFile: false,
  canRemove: true,
};

type UploadQueue = {
  jobs: string[];
  snapshots: Record<string, JobSnapshot>;
  report: (id: string, snapshot: JobSnapshot) => void;
  addJob: () => void;
  removeJob: (id: string) => void;
};

const UploadQueueContext = createContext<UploadQueue | null>(null);

export function useUploadQueue() {
  const queue = useContext(UploadQueueContext);
  if (!queue) {
    throw new Error("useUploadQueue must be used inside UploadQueueProvider");
  }
  return queue;
}

// The queue belongs to the logged-in layout, so its item list and status
// survive client-side navigation. A browser refresh still starts a new queue.
export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const nextId = useRef(2);
  const [jobs, setJobs] = useState(["clothing-1"]);
  const [snapshots, setSnapshots] = useState<Record<string, JobSnapshot>>({});

  const report = useCallback((id: string, snapshot: JobSnapshot) => {
    setSnapshots((current) => ({ ...current, [id]: snapshot }));
  }, []);

  const addJob = useCallback(() => {
    setJobs((current) => {
      if (current.length >= MAX_JOBS) return current;
      return [...current, `clothing-${nextId.current++}`];
    });
  }, []);

  const removeJob = useCallback((id: string) => {
    setSnapshots((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setJobs((current) => {
      const remaining = current.filter((jobId) => jobId !== id);
      return remaining.length > 0
        ? remaining
        : [`clothing-${nextId.current++}`];
    });
  }, []);

  return (
    <UploadQueueContext.Provider
      value={{ jobs, snapshots, report, addJob, removeJob }}
    >
      {children}
    </UploadQueueContext.Provider>
  );
}

// This component never unmounts after the user first opens Add item. Away
// from that page, CSS hides it while background removal and API calls keep
// running. Returning to the page reveals the same controls and results.
export function PersistentUploadWorkspace() {
  const pathname = usePathname();
  const onAddPage = pathname === "/wardrobe/new";
  const [started, setStarted] = useState(onAddPage);
  if (onAddPage && !started) setStarted(true);

  if (!started) return null;

  return (
    <div className={onAddPage ? "px-5 py-5 pb-24 md:px-9 md:py-6" : "hidden"}>
      <MultiItemUploader />
    </div>
  );
}

export function MultiItemUploader() {
  const router = useRouter();
  const { toast } = useToast();
  const { jobs, snapshots, report, addJob, removeJob } = useUploadQueue();

  const saved = useCallback(
    (jobId: string) => {
      removeJob(jobId);
      toast("Saved to your wardrobe");
      router.refresh();
    },
    [removeJob, router, toast],
  );

  return (
    <div className="grid gap-6">
      <section
        aria-label="Clothing upload status"
        className="rounded-xl border border-line bg-card p-4 md:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Upload up to two items at a time</h2>
          </div>
          <button
            type="button"
            onClick={addJob}
            disabled={jobs.length >= MAX_JOBS}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cobalt px-3 py-2 text-xs font-semibold text-white transition hover:bg-cobalt-deep disabled:cursor-not-allowed disabled:opacity-35"
          >
            <PlusIcon className="size-3.5" />
            Add another
          </button>
        </div>

        <div className="mt-4 grid gap-2.5">
          {jobs.map((id, index) => {
            const snapshot = snapshots[id] ?? waiting;
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-line bg-wash/50 px-3 py-2.5"
              >
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                  {snapshot.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={snapshot.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <ShirtIcon className="size-5 text-mute" />
                  )}
                  {snapshot.working && (
                    <span className="absolute inset-0 grid place-items-center bg-paper/70">
                      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink" />
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-[13px] font-medium">Clothing {index + 1}</b>
                    <span className="truncate text-xs text-mute">{snapshot.status}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-tangerine transition-[width] duration-300"
                      style={{ width: `${Math.round(snapshot.progress * 100)}%` }}
                    />
                  </div>
                </div>

                {(jobs.length > 1 || snapshot.hasFile) && (
                  <button
                    type="button"
                    onClick={() => removeJob(id)}
                    disabled={!snapshot.canRemove}
                    aria-label={`Remove clothing ${index + 1}`}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-bad transition hover:bg-bad-light disabled:opacity-35"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {jobs.map((id, index) => (
        <AnalysisProvider key={id}>
          <JobReporter id={id} onChange={report} />
          <section className="rounded-xl border border-line bg-card p-4 md:p-6">
            <h2 className="mb-5 text-sm font-semibold">Clothing {index + 1}</h2>
            <ItemUploader onSaved={() => saved(id)} />
          </section>
        </AnalysisProvider>
      ))}
    </div>
  );
}

function JobReporter({
  id,
  onChange,
}: {
  id: string;
  onChange: (id: string, snapshot: JobSnapshot) => void;
}) {
  const { step, file, preview, error, done, bg, enhance } = useAnalysis();
  const removing = bg.status === "running";
  const beautifying = enhance.iron.status === "running";
  const analyzing = step === "analyzing";
  const saving = step === "saving";

  let status = "Ready to analyse";
  let progress = 0.5;
  if (!file) {
    status = "Waiting for a photo";
    progress = 0;
  } else if (removing) {
    status = "Removing background";
    progress = bg.phase === "download" ? 0.1 + bg.progress * 0.3 : 0.45;
  } else if (beautifying) {
    status = "Beautifying photo";
    progress = 0.45;
  } else if (analyzing) {
    status = "Analysing clothing";
    progress = 0.5 + (done / CHECKLIST.length) * 0.4;
  } else if (saving) {
    status = "Saving to wardrobe";
    progress = 0.95;
  } else if (step === "review") {
    status = "Ready to review";
    progress = 1;
  } else if (error) {
    status = "Needs attention";
  }

  const working = removing || beautifying || analyzing || saving;

  useEffect(() => {
    onChange(id, {
      preview,
      status,
      progress,
      working,
      hasFile: file !== null,
      canRemove: !saving,
    });
  }, [file, id, onChange, preview, progress, saving, status, working]);

  return null;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z" />
    </svg>
  );
}
