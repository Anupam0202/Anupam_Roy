import { useId, useMemo, useState } from "react";
import { binarySearch } from "@workspace/proof-atlas-core/algorithms/binary-search";
import { IslandBoundary } from "./IslandBoundary";

const DEFAULT_ARRAY = "3, 8, 12, 17, 23, 31, 42, 56, 64, 77, 85, 93";

/** The explorer draws one cell per value, so it accepts at most this many. */
export const MAX_VALUES = 64;

const parseNumbers = (s: string): number[] => s.split(/[,\s]+/).filter(Boolean).map(Number);

function BinarySearchExplorerInner() {
  const id = useId();
  const [arrayText, setArrayText] = useState(DEFAULT_ARRAY);
  const [targetText, setTargetText] = useState("64");
  const [step, setStep] = useState(0);

  const values = useMemo(() => parseNumbers(arrayText), [arrayText]);
  const target = Number(targetText);
  // Input problems are reported, never silently corrected: too many values or a missing target refuse to run.
  const inputError =
    values.length > MAX_VALUES
      ? `Enter at most ${MAX_VALUES} numbers; this list has ${values.length}.`
      : targetText.trim() === ""
        ? "Enter a target number."
        : null;
  const searched = useMemo(() => binarySearch(values, target), [values, target]);
  const outcome = inputError ? ({ ok: false, error: "input", message: inputError } as const) : searched;
  const steps = outcome.ok ? outcome.steps : [];
  const current = steps[Math.min(step, steps.length) - 1];

  const reset = () => setStep(0);
  const summary = !outcome.ok
    ? outcome.message
    : steps.length === 0
      ? "The array is empty, so the target is not present."
      : step === 0
        ? `Ready: low = 0, high = ${values.length - 1}. The whole array is the search interval.`
        : `Step ${step} of ${steps.length}: low = ${current.low}, high = ${current.high}, mid = ${current.mid} (value ${current.value}). ${current.decision}${
            step === steps.length && !outcome.found ? " The interval is now empty: the target is not in the array." : ""
          }`;

  const cellState = (i: number) => {
    if (!current) return "in";
    if (i === current.mid) return "mid";
    return i >= current.low && i <= current.high ? "in" : "out";
  };

  return (
    <div className="tool lab-tool">
      <div className="grid grid--2 lab-inputs">
        <div className="field">
          <label htmlFor={`${id}-arr`}>Sorted numbers</label>
          <input
            id={`${id}-arr`}
            className="input mono"
            value={arrayText}
            onChange={(e) => {
              setArrayText(e.target.value);
              reset();
            }}
            spellCheck={false}
            aria-describedby={`${id}-arr-err`}
          />
          {!outcome.ok && outcome.error !== "input" && (
            <p id={`${id}-arr-err`} className="error">
              {outcome.message}{" "}
              {outcome.error === "unsorted" && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setArrayText([...values].sort((a, b) => a - b).join(", "));
                    reset();
                  }}
                >
                  Sort it
                </button>
              )}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${id}-t`}>Target</label>
          <input
            id={`${id}-t`}
            className="input mono"
            type="number"
            value={targetText}
            onChange={(e) => {
              setTargetText(e.target.value);
              reset();
            }}
            aria-describedby={`${id}-input-err`}
          />
        </div>
      </div>
      {inputError && (
        <p id={`${id}-input-err`} className="error" role="alert">
          {inputError}
        </p>
      )}

      <div className="cluster stepper" role="group" aria-label="Step controls">
        <button type="button" className="button button--ghost button--small" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Previous step
        </button>
        <button type="button" className="button button--small" onClick={() => setStep((s) => Math.min(steps.length, s + 1))} disabled={!outcome.ok || step >= steps.length}>
          Next step
        </button>
        <button type="button" className="button button--ghost button--small" onClick={() => setStep(steps.length)} disabled={!outcome.ok || step >= steps.length}>
          Run to end
        </button>
        <button type="button" className="button button--ghost button--small" onClick={reset} disabled={step === 0}>
          Reset
        </button>
      </div>

      <p className="lab-summary" role="status" aria-live="polite">
        {summary}
      </p>

      {outcome.ok && values.length > 0 && (
        <ol className="cells" aria-label="Array with the active interval">
          {values.map((v, i) => {
            const state = cellState(i);
            const isLow = current ? i === current.low : i === 0;
            const isHigh = current ? i === current.high : i === values.length - 1;
            const found = outcome.found && step === steps.length && i === outcome.index;
            return (
              <li key={i} className={`cell cell--${state}${found ? " cell--found" : ""}`}>
                <span className="cell-index mono">{i}</span>
                <span className="cell-value mono">{v}</span>
                <span className="cell-tags mono">
                  {[isLow && "low", current && i === current.mid && "mid", isHigh && "high"].filter(Boolean).join(" ")}
                  <span className="visually-hidden">{state === "out" ? " (excluded)" : ""}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="notice notice--tech small">
        <strong>Invariant.</strong> If the target exists in the original sorted array, it remains inside the active search interval until it is found or the interval becomes empty. Worst case O(log n) time; this iterative version uses O(1) extra space.
      </p>

      {outcome.ok && steps.length > 0 && (
        <details className="disclosure">
          <summary>All {steps.length} steps as a table</summary>
          <div className="disclosure-body table-wrap">
            <table>
              <caption className="visually-hidden">Binary search steps</caption>
              <thead>
                <tr>
                  <th scope="col">Step</th>
                  <th scope="col" className="num">
                    low
                  </th>
                  <th scope="col" className="num">
                    high
                  </th>
                  <th scope="col" className="num">
                    mid
                  </th>
                  <th scope="col" className="num">
                    a[mid]
                  </th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <tr key={s.step}>
                    <td>{s.step}</td>
                    <td className="num mono">{s.low}</td>
                    <td className="num mono">{s.high}</td>
                    <td className="num mono">{s.mid}</td>
                    <td className="num mono">{s.value}</td>
                    <td>{s.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export default function BinarySearchExplorer() {
  return (
    <IslandBoundary name="binary-search">
      <BinarySearchExplorerInner />
    </IslandBoundary>
  );
}
