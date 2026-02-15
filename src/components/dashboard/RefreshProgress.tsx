import { Loader2, CheckCircle2, Send, Download, Database, X } from "lucide-react";

export type RefreshStage =
  | "requesting_followup"
  | "receiving_followup"
  | "requesting_produtos"
  | "receiving_produtos"
  | "requesting_saldo"
  | "receiving_saldo"
  | "requesting_recebimentos"
  | "receiving_recebimentos"
  | "saving"
  | "done"
  | null;

const stageConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  requesting_followup: { label: "Solicitando dados do Followup à API...", icon: <Send className="h-4 w-4" /> },
  receiving_followup: { label: "Recebendo dados do Followup...", icon: <Download className="h-4 w-4" /> },
  requesting_produtos: { label: "Solicitando dados de Produtos à API...", icon: <Send className="h-4 w-4" /> },
  receiving_produtos: { label: "Recebendo dados de Produtos...", icon: <Download className="h-4 w-4" /> },
  requesting_saldo: { label: "Solicitando Saldo Base à API...", icon: <Send className="h-4 w-4" /> },
  receiving_saldo: { label: "Recebendo dados do Saldo Base...", icon: <Download className="h-4 w-4" /> },
  requesting_recebimentos: { label: "Solicitando Recebimentos à API...", icon: <Send className="h-4 w-4" /> },
  receiving_recebimentos: { label: "Recebendo dados de Recebimentos...", icon: <Download className="h-4 w-4" /> },
  saving: { label: "Salvando dados no banco...", icon: <Database className="h-4 w-4" /> },
  done: { label: "Atualização concluída!", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
};

interface RefreshProgressProps {
  stage: RefreshStage;
  recordCount?: number;
  onDismiss?: () => void;
}

export const RefreshProgress = ({ stage, recordCount, onDismiss }: RefreshProgressProps) => {
  if (!stage) return null;

  const config = stageConfig[stage];
  if (!config) return null;

  const isDone = stage === "done";
  const receivingStages = ["receiving_followup", "receiving_produtos", "receiving_saldo", "receiving_recebimentos"];
  const label =
    receivingStages.includes(stage) && recordCount
      ? `${config.label.replace("...", "")} (${recordCount.toLocaleString()} registros)`
      : config.label;

  return (
    <div className={`mx-6 mt-2 p-3 rounded-md border text-sm flex items-center gap-3 transition-all ${
      isDone
        ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
        : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
    }`}>
      {isDone ? config.icon : <Loader2 className="h-4 w-4 animate-spin" />}
      {config.icon !== undefined && !isDone && config.icon}
      <span className="flex-1">{label}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
