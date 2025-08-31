import { AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-glass-primary backdrop-blur-glass border border-border/50 shadow-glass">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-8 h-8 text-destructive animate-pulse" />
          </div>
          
          <DialogTitle className="text-xl font-semibold text-center text-foreground">
            Exit Council Session?
          </DialogTitle>
          
          <DialogDescription className="text-center text-foreground-muted leading-relaxed">
            ⚠️ If you exit, you cannot resume this council session. All current progress and context will be lost.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-glass-secondary border-border/50 text-foreground-muted hover:text-foreground hover:bg-glass-overlay transition-all duration-300"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            variant="destructive"
            onClick={onConfirmExit}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-glow-accent hover:shadow-glow-lg transition-all duration-300"
          >
            Exit Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExitConfirmationModal;