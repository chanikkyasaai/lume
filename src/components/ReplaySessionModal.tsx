import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CouncilSession } from "@/lib/history";
import { PlayCircle, X } from "lucide-react";

interface ReplaySessionModalProps {
  isOpen: boolean;
  session: CouncilSession | null;
  onClose: () => void;
  onReplay: (session: CouncilSession) => void;
}

export const ReplaySessionModal = ({ isOpen, session, onClose, onReplay }: ReplaySessionModalProps) => {
  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900/80 backdrop-blur-md border-glow-primary/50 text-white z-[70]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-quicksand">Replay Session?</DialogTitle>
          <DialogDescription className="text-gray-300 pt-2">
            Would you like to replay the council discussion on the topic:
            <strong className="block mt-2 text-white font-semibold">"{session.topic}"</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={() => onReplay(session)}
            className="bg-gradient-primary rounded-lg text-white font-quicksand hover:shadow-glow-lg transition-all duration-300"
          >
            <PlayCircle className="mr-2 h-4 w-4" /> Replay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
