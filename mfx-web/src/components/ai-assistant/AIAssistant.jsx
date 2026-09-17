import { useState, useCallback } from "react";
import FloatingButton from "./FloatingButton";
import AssistantPanel from "./AssistantPanel";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <>
      <FloatingButton isOpen={isOpen} onClick={toggle} />
      <AssistantPanel isOpen={isOpen} onClose={close} />
    </>
  );
}