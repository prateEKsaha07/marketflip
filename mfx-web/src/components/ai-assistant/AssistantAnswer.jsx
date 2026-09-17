import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BUYER_ROUTES = {
  requests: "/buyer/requests",
  auctions: "/buyer/auctions",
  purchases: "/buyer/purchases",
  chats: "/buyer/chat",
  dashboard: "/buyer/dashboard",
};

const SHOP_ROUTES = {
  "my auctions": "/shop/auctions",
  auctions: "/shop/auctions",
  "my bids": "/shop/my-bids",
  bids: "/shop/my-bids",
  requests: "/shop/requests",
  completed: "/shop/completed",
  chats: "/shop/chat",
  dashboard: "/shop/dashboard",
};

function resolvePagePath(pageLine, role) {
  const isShop = role === "shop_owner";
  const fallback = isShop ? "/shop/dashboard" : "/buyer/dashboard";

  if (!pageLine) return fallback;

  const name = pageLine.replace("→", "").trim().toLowerCase();
  const routes = isShop ? SHOP_ROUTES : BUYER_ROUTES;

  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (name.includes(key)) return routes[key];
  }

  return fallback;
}

export default function AssistantAnswer({ question, answer, onAskAnother }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const roleFromContext = user?.role;
  const roleFromStorage =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const role = roleFromContext || roleFromStorage;

  const lines = answer
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.startsWith("•"));
  const pageLine = lines.find((l) => l.startsWith("→"));
  const pagePath = resolvePagePath(pageLine, role);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 flex flex-col gap-3"
    >
      {/* Question bubble — right aligned, ink */}
      <div className="self-end max-w-[85%] rounded-2xl rounded-br-md
                      bg-[#1A1A2E] text-[#FFFCE1]
                      px-3.5 py-2 text-[12px] leading-relaxed">
        {question}
      </div>

      {/* Answer bubble — left aligned, soft fill */}
      <div className="self-start max-w-[90%] rounded-2xl rounded-bl-md
                      bg-[#F8F6F0] text-[#1A1A2E]
                      px-3.5 py-3">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2
                        text-[10px] uppercase tracking-wider text-[#A0A0B0]">
          <span className="w-4 h-4 rounded-full grid place-items-center
                           bg-[#1A1A2E] text-[#FFFCE1]">
            <Command size={9} strokeWidth={2.4} />
          </span>
          <span>Assistant</span>
        </div>

        {/* Bullets */}
        {bullets.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-[12px] leading-snug">
            {bullets.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#FFBE91] font-bold flex-shrink-0">•</span>
                <span>{line.replace(/^•\s*/, "")}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Fallback if no bullets — show raw answer */}
        {bullets.length === 0 && answer && (
          <p className="text-[12px] leading-relaxed text-[#1A1A2E]">
            {answer}
          </p>
        )}

        {/* View details link */}
        {pagePath && (
          <button
            onClick={() => navigate(pagePath)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px]
                       font-medium text-[#1A1A2E] hover:text-[#FF8B94]
                       transition-colors
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#FFBE91]/40 rounded
                       px-1 -mx-1 py-0.5"
          >
            View details
            <ArrowRight size={11} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Ask another */}
      <button
        onClick={onAskAnother}
        className="self-start text-[11px] text-[#A0A0B0]
                   hover:text-[#1A1A2E]
                   transition-colors
                   focus:outline-none focus-visible:ring-2
                   focus-visible:ring-[#FFBE91]/40 rounded
                   px-1 -mx-1 py-0.5"
      >
        Ask another
      </button>
    </motion.div>
  );
}