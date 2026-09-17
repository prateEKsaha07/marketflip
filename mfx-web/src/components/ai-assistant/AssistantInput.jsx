import { Command, Loader2, Wand2, Mic } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";

const BUYER_EXAMPLES = [
  "how many bids do I have?",
  "which request expires soonest?",
  "used mountain bike under 8000, urgent, 560001",
  "iPhone 13 around 40k",
];

const SHOP_EXAMPLES = [
  "how's my bike auction going?",
  "how many auctions do I have?",
  "did my last sale complete?",
  "show me active auctions",
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

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isShop = role === "shop_owner";

  const examples = isShop ? SHOP_EXAMPLES : BUYER_EXAMPLES;

  const placeholder = isShop
    ? `Ask "how's my auction going?" or "who's leading?"`
    : `Ask "how many bids do I have?" or describe what you want to buy…`;

  const applyExample = (example) => {
    setText(example);
  };

  const handleMicClick = () => {
    toast("Voice input coming soon", {
      description: "I'm working on it. For now, type your question.",
    });
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Helper text */}
      <div className="flex items-start gap-2 text-[11px] text-[#A0A0B0] leading-relaxed">
        <span className="w-5 h-5 rounded-full grid place-items-center
                         bg-[#1A1A2E] text-[#FFFCE1] flex-shrink-0 mt-0.5">
          <Command size={10} strokeWidth={2.4} />
        </span>
        {isShop ? (
          <p>
            Ask about your auctions or bids. Try{" "}
            <span className="text-[#4A4A5A] font-medium">
              "how's my auction going?"
            </span>
          </p>
        ) : (
          <p>
            Ask about your requests or bids — or describe something you want
            to buy. Be specific:{" "}
            <span className="text-[#4A4A5A] font-medium">item</span>,{" "}
            <span className="text-[#4A4A5A] font-medium">budget</span>,{" "}
            <span className="text-[#4A4A5A] font-medium">pincode</span>.
          </p>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={5}
        disabled={isParsing}
        className="w-full resize-none rounded-xl bg-[#F8F6F0]/60 border-0
                   p-3 text-[12px] leading-relaxed text-[#1A1A2E]
                   placeholder:text-[#A0A0B0]
                   focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40
                   focus:bg-white transition-all
                   disabled:opacity-60 disabled:cursor-not-allowed
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />

      {/* Example chips */}
      {!text && !isParsing && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A0A0B0] font-medium
                           uppercase tracking-wide">
            Try an example
          </span>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((example, idx) => (
              <motion.button
                key={idx}
                type="button"
                onClick={() => applyExample(example)}
                whileHover={reduceMotion ? {} : { y: -1 }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-[10px] px-2.5 py-1.5 rounded-full
                           bg-[#F8F6F0]/70 text-[#4A4A5A]
                           hover:bg-[#F8F6F0] hover:text-[#1A1A2E]
                           transition-colors text-left
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[#FFBE91]/40"
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
          className="flex items-center gap-2 rounded-lg bg-rose-50
                     px-3 py-2 text-[11px] text-rose-700"
        >
          <span className="flex-1 leading-relaxed">{error}</span>
          <button
            onClick={onRetry}
            className="text-rose-700 underline text-[10px] font-medium
                       hover:text-rose-800
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-rose-300 rounded"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <motion.button
          type="button"
          onClick={handleMicClick}
          disabled={isParsing}
          whileHover={reduceMotion ? {} : { scale: 1.06 }}
          whileTap={reduceMotion ? {} : { scale: 0.94 }}
          transition={{ duration: 0.15 }}
          aria-label="Voice input (coming soon)"
          className="p-2 rounded-full text-[#A0A0B0]
                     hover:text-[#1A1A2E] hover:bg-[#F8F6F0]
                     transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-[#FFBE91]"
        >
          <Mic size={14} strokeWidth={2.2} />
        </motion.button>

        <button
          onClick={onParse}
          disabled={!canParse}
          className="inline-flex items-center gap-1.5 rounded-full
                     bg-[#1A1A2E] px-4 py-1.5 text-[11px] font-medium
                     text-[#FFFCE1]
                     transition-colors duration-150
                     hover:bg-[#2A2A3E]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-[#FFBE91] focus-visible:ring-offset-2
                     focus-visible:ring-offset-white"
        >
          {isParsing ? (
            <>
              <Loader2 size={12} strokeWidth={2.2} className="animate-spin" />
              <span>Thinking…</span>
            </>
          ) : (
            <>
              <span>Ask</span>
              <Wand2 size={12} strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}