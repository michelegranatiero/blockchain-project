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

const commitSchema = z.object({
  file: z.any().refine((file) => {
    if (!file) return false;
    return true;
  }),
  votes: z.coerce.number().min(2).max(1000), // how should they be????
})

// CHECK IF WORKER HAS ALREADY COMMITED WORK! EVEN IN SMART CONTRACT

function CommitWorkModal({ className = "", disabledState = false, taskId, forceUpdate}) {
  
  const {wallet, commitWork} = useWeb3(); // create commitWork function in useWeb3

  const form = useForm({
    resolver: zodResolver(commitSchema),
    defaultValues: {
      file: "",
      votes: "", // how should they be?
    },
  });

  const [open, setOpen] = useState(false);
  const [loadingBtn, setloadingBtn] = useState(false);

  async function onSubmit(values){
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloadingBtn(true);

    const ipfsFile = values.file;
    //send to ipfs...
    //const res = await commitWork( taskId, ipfsHash, values.votes);
    if (res) {
      setOpen(false);
      alert("Transaction successful");
      //window.location.reload();
      forceUpdate((k) => k + 1);
    }else alert("Transaction canceled or denied.");
    setloadingBtn(false);
  }

  function handleOpenChanging() {
    if (open == false && wallet.accounts.length == 0) {        
      setOpen(false);
      alert("Please, connect your account first.");
    }else setOpen(!open);

  }

  const formFields = [
    {
      name: "votes",
      label: "Votes",
      type: "number",
      placeholder: "votes",
    },
    {
      name: "file",
      label: "file",
      type: "file",
      placeholder: "",
    },
  ]



  return (
    <Dialog open={open} onOpenChange={handleOpenChanging}>
      <DialogTrigger asChild onClick={(e) => {e.stopPropagation()}}>
        <Button className={` ${className}`} disabled={disabledState}>Commit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[470px]">
        <DialogHeader>
          <DialogTitle>Commit your work</DialogTitle>
          <DialogDescription>
            insert your votes and file with your weights.
          </DialogDescription>
        </DialogHeader>
        <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {formFields.map((item) => (
            <FormField
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={item.name}>{item.label}</FormLabel>
                  <FormControl>
                    <Input type={item.type} placeholder={item.placeholder} {...field}/>
                  </FormControl>
                  {/* <FormDescription>
                    Description
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {/* <div className='text-end'> */}
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
            
          {/* </div> */}

        </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  )
}

export default CommitWorkModal;