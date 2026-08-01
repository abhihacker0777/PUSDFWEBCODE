import PaperAssistantLauncher from "./paperAssistant/PaperAssistantLauncher";
import PaperAssistantPanel from "./paperAssistant/PaperAssistantPanel";
import usePaperAssistantController from "./paperAssistant/usePaperAssistantController";

export default function PaperAssistant() {
  const assistant = usePaperAssistantController();

  return (
    <>
      <PaperAssistantLauncher
        isOpen={assistant.isOpen}
        onOpen={assistant.openAssistant}
      />

      {assistant.isOpen && <PaperAssistantPanel {...assistant} />}
    </>
  );
}
