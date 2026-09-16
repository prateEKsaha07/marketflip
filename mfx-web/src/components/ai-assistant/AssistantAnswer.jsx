import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AssistantAnswer({ question, answer, onAskAnother }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const lines = answer
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.startsWith("•"));
  const pageLine = lines.find((l) => l.startsWith("→"));

  const pagePath = (() => {
    if (!pageLine) return null;
    const name = pageLine.replace("→", "").trim().toLowerCase();
    if (name.includes("request")) return "/buyer/requests";
    if (name.includes("auction")) return "/buyer/auctions";
    if (name.includes("purchase")) return "/buyer/purchases";
    if (name.includes("chat")) return "/buyer/chat";
    return "/buyer/dashboard";
  })();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4 flex flex-col gap-3"
    >
      {/* Buyer's question */}
      <div className="self-end max-w-[85%] rounded-2xl bg-indigo-500
                      text-white px-4 py-2 text-sm">
        {question}
      </div>

      {/* Assistant's answer */}
      <div className="self-start max-w-[90%] rounded-2xl bg-[#F5F3EF]
                      text-[#1A1A2E] px-4 py-3 text-sm">
        <div className="flex items-center gap-1.5 mb-2 text-[10px]
                        uppercase tracking-wider text-[#A0A0B0]">
          <Sparkles size={11} className="text-indigo-500" />
          Assistant
        </div>

        <ul className="flex flex-col gap-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="text-[#FFBE91] font-bold">•</span>
              <span>{line.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>

        {pagePath && (
          <button
            onClick={() => navigate(pagePath)}
            className="mt-3 inline-flex items-center gap-1 text-xs
                       font-medium text-indigo-600 hover:text-indigo-800
                       transition-colors"
          >
            View details
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <button
        onClick={onAskAnother}
        className="self-start text-xs text-gray-500 hover:text-gray-800
                   underline transition-colors"
      >
        Ask another
      </button>
    </motion.div>
  );
}