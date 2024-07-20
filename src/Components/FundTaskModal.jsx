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
import { useParams } from "react-router-dom";
import { Input } from "@/Components/ui/input"
import { Loader2 } from "lucide-react"

import { useWeb3 } from "@/hooks/useWeb3";
import  { gweiToWei, weiToGwei } from '@/utils/formatWeb3'


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


function FundTaskModal({ className = "", disabledState = false, taskId, forceUpdate}) {
  
  const {wallet, fund} = useWeb3();
  const [maxAmount, setMaxAmount] = useState(0);
  useEffect(() => {
    setMaxAmount(Number(wallet.balance));
    
  }, [wallet]);

  const fundSchema = z.object({
    amount: z.coerce.number().max(weiToGwei(maxAmount), {
      message: "You don't have enough funds in your account.",
    }).refine((gwei) => {      
      if (gweiToWei(gwei) >= 1) return true;
      return false;
    }, { message: "The amount must be at least 1 wei (0.000000001 gwei)."}),
  })

  const form = useForm({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: "",
    },
  });


  const [open, setOpen] = useState(false);
  const [loadingBtn, setloadingBtn] = useState(false);

  async function onSubmit(values){
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloadingBtn(true);
    const res = await fund( taskId, gweiToWei(values.amount));
    if (res) {
      setOpen(false);
      console.log("Task funded successfully");
      //window.location.reload();
      forceUpdate((k) => k + 1);
    }else alert("Funding canceled or denied.");
    setloadingBtn(false);
  }

  function handleOpenChanging() {
    if (open == false && wallet.accounts.length == 0) {     
      alert("Please, connect your account first.");
    }else if (open == false && maxAmount == 0) {
      alert("You don't have enough funds in your account.");
    }
    else setOpen(!open);
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChanging}>
      <DialogTrigger asChild onClick={(e) => {e.stopPropagation()}}>
        <Button className={` ${className}`} disabled={disabledState}>Fund</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[470px]">
        <DialogHeader>
          <DialogTitle>Funding</DialogTitle>
          <DialogDescription>
            Specify how much are you going to invest in this task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form} >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="amount">Amount (Gwei)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="insert a value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              {loadingBtn ? 
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
              : <Button type="submit">Fund</Button>
              }
            </DialogFooter>
          </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  )
}

export default FundTaskModal;