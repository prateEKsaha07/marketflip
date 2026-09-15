import { useState } from "react";
import FloatingButton from "./FloatingButton";
import AssistantPanel from "./AssistantPanel";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
      <AssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}