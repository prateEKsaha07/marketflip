import { Loader2, Wand2, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const EXAMPLE_PROMPTS = [
  "how many bids do I have?",
  "which request expires soonest?",
  "used mountain bike under 8000, urgent, 560001",
  "iPhone 13 around 40k",
];

export default function AssistantInput({
  text,
  setText,
  onParse,
  isParsing,
  error,
  onRetry,
}) {
  const reduceMotion = useReducedMotion();
  const canParse = text.trim().length > 3 && !isParsing;

  const applyExample = (example) => {
    setText(example);
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Helper text */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Sparkles size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <p>
          Ask a question about your requests or bids, or describe something
          you want to buy. Be specific —{" "}
          <span className="text-gray-700 font-medium">item</span>,{" "}
          <span className="text-gray-700 font-medium">budget</span>,{" "}
          <span className="text-gray-700 font-medium">pincode</span>.
        </p>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Ask "how many bids do I have?" or describe what you want to buy…`}
        rows={5}
        disabled={isParsing}
        className="w-full resize-none rounded-xl border border-gray-200
                   p-3 text-sm text-gray-900 placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-400
                   focus:border-transparent transition
                   disabled:bg-gray-50 disabled:cursor-not-allowed"
      />

      {/* Example chips */}
      {!text && !isParsing && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500 font-medium">
            Try an example:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <motion.button
                key={idx}
                type="button"
                onClick={() => applyExample(example)}
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                className="text-xs px-2.5 py-1.5 rounded-full
                           border border-gray-200 bg-gray-50
                           text-gray-600 hover:border-indigo-300
                           hover:bg-indigo-50 hover:text-indigo-700
                           transition-colors text-left"
              >
                {example}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, x: [0, -4, 4, -3, 3, 0] }
          }
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 rounded-lg bg-red-50
                     px-3 py-2 text-sm text-red-700"
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={onRetry}
            className="text-red-700 underline text-xs font-medium
                       hover:text-red-800"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Submit button — label changes based on question vs create intent */}
      <div className="flex justify-end">
        <button
          onClick={onParse}
          disabled={!canParse}
          className="inline-flex items-center gap-2 rounded-lg
                     bg-indigo-500 px-4 py-2 text-sm font-medium text-white
                     transition hover:bg-indigo-600 hover:-translate-y-px
                     active:translate-y-0
                     disabled:opacity-50 disabled:cursor-not-allowed
                     disabled:hover:translate-y-0"
        >
          {isParsing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Thinking…</span>
            </>
          ) : (
            <>
              <span>Ask</span>
              <Wand2 size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}