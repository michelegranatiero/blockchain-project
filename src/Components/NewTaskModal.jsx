import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog"
import NewTaskForm from "./NewTaskForm"
import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";


function NewTaskModal({forceUpdate}) {

  const { wallet } = useWeb3();

  const [open, setOpen] = useState(false);

  function handleOpenChanging() {
    if (open == false && wallet.accounts.length == 0) {        
      setOpen(false);
      alert("Please, connect your account first.");
    }else setOpen(!open);

  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChanging}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-emerald-600 hover:bg-emerald-600/90 text-white ">New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>
            Fill in the form with the task details.
          </DialogDescription>
        </DialogHeader>
        <NewTaskForm setOpenState = {setOpen} forceUpdate={forceUpdate}/>
      </DialogContent>
    </Dialog>
  )
}

export default NewTaskModal;