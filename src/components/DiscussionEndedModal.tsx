import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface DiscussionEndedModalProps {
  isOpen: boolean;
  onDone: () => void;
  duration: number; // in seconds
}

export const DiscussionEndedModal = ({ isOpen, onDone, duration }: DiscussionEndedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onDone}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900/80 backdrop-blur-md border-glow-primary/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center text-center gap-4">
            <CheckCircle className="w-24 h-24 text-green-400" />
            <span className="text-2xl font-quicksand">Discussion Ended</span>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300 pt-2">
            The council has concluded its discussion.
            The session lasted approximately {Math.round(duration / 60)} minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onDone}
            className="w-full bg-gradient-primary rounded-lg text-white font-quicksand hover:shadow-glow-lg transition-all duration-300"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
