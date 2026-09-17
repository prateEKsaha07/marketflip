import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Command, X } from "lucide-react";

import { parseRequest, askQuestion } from "../../api/client";
import AssistantInput from "./AssistantInput";
import AssistantPreview from "./AssistantPreview";
import AssistantAnswer from "./AssistantAnswer";

const looksLikeQuestion = (text) => {
  const t = text.toLowerCase().trim();
  if (t.endsWith("?")) return true;
  const starters = [
    "how", "what", "which", "when", "where", "who", "why",
    "show", "list", "tell me", "do i", "have i", "did i",
  ];
  return starters.some((w) => t.startsWith(w));
};

export default function AssistantPanel({ isOpen, onClose }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState("idle");
  const [text, setText] = useState("");
  const [draft, setDraft] = useState(null);
  const [missing, setMissing] = useState([]);
  const [lowConf, setLowConf] = useState([]);
  const [logId, setLogId] = useState(null);
  const [error, setError] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleParse = async () => {
    setState("parsing");
    setError(null);
    try {
      const result = await parseRequest(text);
      setDraft(result.draft);
      setMissing(result.missing_fields || []);
      setLowConf(result.low_confidence_fields || []);
      setLogId(result.log_id);
      setState("preview");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Couldn't parse your request. Please try again.";
      setError(typeof msg === "string" ? msg : "Parse failed");
      setState("idle");
    }
  };

  const handleAsk = async () => {
    setState("asking");
    setError(null);
    try {
      const result = await askQuestion(text);
      setAnswerResult({
        question: text,
        answer: result.answer,
        logId: result.log_id,
      });
      setState("answered");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Couldn't get an answer. Please try again.";
      setError(typeof msg === "string" ? msg : "Ask failed");
      setState("idle");
    }
  };

  const handleSubmit = () => {
    if (looksLikeQuestion(text)) {
      handleAsk();
    } else {
      handleParse();
    }
  };

  const handleReset = () => {
    setState("idle");
    setText("");
    setDraft(null);
    setMissing([]);
    setLowConf([]);
    setLogId(null);
    setError(null);
    setAnswerResult(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(handleReset, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — simple, clean fade */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[55] pointer-events-auto
                       bg-[#1A1A2E]/15 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel — anchored bottom-right, above the floating button */}
          <motion.div
            key="panel"
            role="dialog"
            aria-label="AI assistant"
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed bottom-24 right-5 sm:right-6 z-[58]
                       w-[380px] max-w-[calc(100vw-40px)]
                       max-h-[min(640px,calc(100vh-140px))]
                       bg-white rounded-2xl
                       ring-1 ring-[#1A1A2E]/5
                       shadow-[0_8px_32px_-8px_rgba(26,26,46,0.18),0_2px_8px_-2px_rgba(26,26,46,0.06)]
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="flex items-center gap-2.5 px-4 py-3
                               border-b border-[#EEECE6]">
              <span className="w-7 h-7 rounded-full grid place-items-center
                               bg-[#1A1A2E] text-[#FFFCE1]">
                <Command size={13} strokeWidth={2.2} />
              </span>
              <h3 className="flex-1 text-[13px] font-semibold text-[#1A1A2E] tracking-tight">
                Ask AI
              </h3>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="p-1.5 rounded-full text-[#A0A0B0]
                           hover:text-[#1A1A2E] hover:bg-[#F8F6F0]
                           transition-colors duration-150
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[#FFBE91] focus-visible:ring-offset-1"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </header>

            {/* Body */}
            <div className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {state === "idle" || state === "parsing" || state === "asking" ? (
                <AssistantInput
                  text={text}
                  setText={setText}
                  onParse={handleSubmit}
                  isParsing={state === "parsing" || state === "asking"}
                  error={error}
                  onRetry={handleSubmit}
                />
              ) : state === "answered" && answerResult ? (
                <AssistantAnswer
                  question={answerResult.question}
                  answer={answerResult.answer}
                  onAskAnother={handleReset}
                />
              ) : (
                <AssistantPreview
                  draft={draft}
                  missingFields={missing}
                  lowConfidenceFields={lowConf}
                  logId={logId}
                  onCancel={handleReset}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}