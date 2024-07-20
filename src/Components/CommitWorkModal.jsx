import { useEffect, useReducer, useState } from "react";
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
import { Input } from "@/Components/ui/input"
import { Loader2 } from "lucide-react"

import { useWeb3 } from "@/hooks/useWeb3";

import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/Components/ui/form"


// CHECK IF WORKER HAS ALREADY COMMITED WORK! EVEN IN SMART CONTRACT

function CommitWorkModal({ className = "", disabledState = false, task, forceUpdate}) {

  const baseSchema = {}
  if (task.rounds.length < task.numberOfRounds) {
    baseSchema.commitFile = z.instanceof(FileList).refine((file) => {
      if (file.length == 0 || !file) return false;
      return true;
    })
  }
  if (task.rounds.length > 1) {
    baseSchema.votesFile = z.instanceof(FileList).refine((file) => {
      console.log(file);
      
      if (file.length == 0 || !file || file[0].type != "application/json") return false;
      return true;
    });
  }

  const commitSchema = z.object(baseSchema)
  
  const {wallet, commitWork} = useWeb3(); // create commitWork function in useWeb3

  const form = useForm({
    resolver: zodResolver(commitSchema),
    defaultValues: {
      votesFile: "",
      commitFile: "",
    },
  });

  const [open, setOpen] = useState(false);
  const [loadingBtn, setloadingBtn] = useState(false);

  const commitFileRef = form.register("commitFile"); // fundamental for input file
  const votesFileRef = form.register("votesFile"); // fundamental for input file
  
  async function onSubmit(values){
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloadingBtn(true);

    let votes = null;
    let work = null;
    if(task.rounds.length > 1) votes = values.votesFile[0]
    if (task.rounds.length < task.numberOfRounds) work = values.commitFile[0];

    const res = await commitWork( task, work, votes);
    if (res) {
      setOpen(false);
      console.log("Transaction successful");
      //window.location.reload();
      forceUpdate((k) => k + 1);
    }else alert("Transaction canceled or denied.\n\nCheck if your \"votes\" file contains all and only the correct addresses for the previous round workers.");
    setloadingBtn(false);
  }

  function handleOpenChanging() {
    if (open == false && wallet.accounts.length == 0) {        
      setOpen(false);
      alert("Please, connect your account first.");
    }else setOpen(!open);

  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChanging}>
      <DialogTrigger asChild onClick={(e) => {e.stopPropagation()}}>
        <Button className={` ${className}`} disabled={disabledState}>Commit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[470px]">
        <DialogHeader>
          <DialogTitle>Commit your work</DialogTitle>
          <DialogDescription>
            Upload your files.
          </DialogDescription>
        </DialogHeader>
        <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {task.rounds.length > 1? <FormField
            control={form.control}
            name="votesFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="votesFile">Votes File (.json)</FormLabel>
                <FormControl>
                  <Input type="file"{...votesFileRef} accept="application/json" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> : null}
          {task.rounds.length < task.numberOfRounds ?
            <FormField
            control={form.control}
            name="commitFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="commitFile">Commit File (.pickle)</FormLabel>
                <FormControl>
                  <Input type="file" {...commitFileRef}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> : null}
          <DialogFooter >
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            {loadingBtn ? 
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
            : <Button type="submit">Commit</Button>
            }
          </DialogFooter>
        </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  )
}

export default CommitWorkModal;