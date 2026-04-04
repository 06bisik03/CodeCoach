import { MonacoEditorPanel } from "@/components/monaco-editor-panel";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-transparent px-4 py-4 text-foreground md:px-6">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] border border-border bg-panel/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur xl:min-h-[calc(100vh-3rem)]">
        <nav className="flex flex-col gap-4 border-b border-border bg-panel-strong/95 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent">
              Live Interview Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              CodeCoach
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-slate-200">
              <span className="text-slate-400">Language</span>
              <select
                aria-label="Programming language"
                defaultValue="Python"
                className="rounded-xl bg-panel-strong px-3 py-2 text-sm text-white outline-none ring-0"
              >
                <option>Python</option>
                <option>JavaScript</option>
                <option>Java</option>
                <option>C++</option>
              </select>
            </label>

            <button className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong">
              Run Code
            </button>
          </div>
        </nav>

        <section className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
          <aside className="flex min-h-[280px] flex-col rounded-[24px] border border-border bg-panel-strong p-5 lg:basis-1/4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Problem
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Two Sum
                </h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Easy
              </span>
            </div>

            <div className="space-y-4 text-sm leading-7 text-slate-300">
              <p>
                Given an array of integers and a target value, return the
                indices of the two numbers that add up to the target.
              </p>
              <p>
                This panel is a placeholder for the full prompt, examples,
                constraints, and interview notes.
              </p>
              <div className="rounded-2xl border border-border bg-panel p-4 text-slate-400">
                Example: <span className="text-slate-200">nums = [2, 7, 11, 15], target = 9</span>
              </div>
              <div className="rounded-2xl border border-dashed border-border p-4 text-slate-400">
                Expected guidance area for hints, constraints, and edge cases.
              </div>
            </div>
          </aside>

          <section className="flex min-h-[420px] flex-col rounded-[24px] border border-border bg-panel-strong lg:basis-[45%]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Editor
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Solution Workspace
                </h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                Python
              </span>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-[24px]">
              <MonacoEditorPanel />
            </div>
          </section>

          <aside className="flex min-h-[280px] flex-col rounded-[24px] border border-border bg-panel-strong lg:basis-[30%]">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                AI Coach
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Interview Chat
              </h2>
            </div>

            <div className="flex flex-1 flex-col gap-4 px-5 py-5">
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-panel px-4 py-3 text-sm leading-6 text-slate-300">
                I’ll watch for brute-force patterns and suggest interview-safe
                optimizations as you code.
              </div>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-accent/15 px-4 py-3 text-sm leading-6 text-sky-100">
                Sounds good. Keep an eye on time complexity and edge cases.
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-panel px-4 py-3 text-sm leading-6 text-slate-300">
                Placeholder chat UI for now. No backend or assistant logic has
                been added in this phase.
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="flex items-end gap-3 rounded-2xl border border-border bg-panel px-3 py-3">
                <textarea
                  aria-label="Chat input"
                  placeholder="Ask CodeCoach for a hint..."
                  className="min-h-20 flex-1 resize-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
                <button className="rounded-xl border border-border bg-panel-muted px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:text-sky-200">
                  Send
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
