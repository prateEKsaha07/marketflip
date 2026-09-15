import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { parseRequest } from "../../api/client";
import AssistantInput from "./AssistantInput";
import AssistantPreview from "./AssistantPreview";

export default function AssistantPanel({ isOpen, onClose }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState("idle");
  const [text, setText] = useState("");
  const [draft, setDraft] = useState(null);
  const [missing, setMissing] = useState([]);
  const [lowConf, setLowConf] = useState([]);
  const [logId, setLogId] = useState(null);
  const [error, setError] = useState(null);

  // Esc to close + lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
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

  const handleReset = () => {
    setState("idle");
    setText("");
    setDraft(null);
    setMissing([]);
    setLowConf([]);
    setLogId(null);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(handleReset, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur — delayed + pulse-in */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[55] pointer-events-auto"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{
              opacity: [0, 1, 0.92, 1],
              backdropFilter: [
                "blur(0px)",
                "blur(14px)",
                "blur(10px)",
                "blur(12px)",
              ],
              backgroundColor: [
                "rgba(255,252,225,0)",
                "rgba(255,252,225,0.55)",
                "rgba(255,252,225,0.45)",
                "rgba(255,252,225,0.5)",
              ],
            }}
            exit={{
              opacity: 0,
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(255,252,225,0)",
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              times: [0, 0.35, 0.7, 1],
              ease: "easeOut",
            }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-label="AI assistant"
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 20, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20, scale: 0.98 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed bottom-24 right-6 z-[58] w-[380px]
                       max-w-[calc(100vw-48px)]
                       max-h-[min(640px,calc(100vh-140px))]
                       bg-white rounded-2xl shadow-2xl shadow-gray-900/15
                       flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <motion.span
                animate={
                  reduceMotion
                    ? {}
                    : { rotate: [0, 10, 0], scale: [1, 1.1, 1] }
                }
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-indigo-500"
              >
                <Sparkles size={16} />
              </motion.span>
              <h3 className="flex-1 text-sm font-semibold text-gray-900">
                Ask AI
              </h3>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="p-1 text-gray-400 hover:text-gray-700
                           transition-transform hover:rotate-90 duration-200"
              >
                <X size={18} />
              </button>
            </header>

            <div className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {state === "idle" || state === "parsing" ? (
                <AssistantInput
                  text={text}
                  setText={setText}
                  onParse={handleParse}
                  isParsing={state === "parsing"}
                  error={error}
                  onRetry={handleParse}
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