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
    setMaxAmount(wallet.balance);
    
  }, [wallet]);

  const fundSchema = z.object({
    weiAmount: z.coerce.bigint().min(1, {
      message: "The amount of wei should be greater than 0.",
    }).max(maxAmount, {
      message: "You don't have enough funds in your account.",
    }),
  })

  const form = useForm({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      weiAmount: "",
    },
  });


  const [open, setOpen] = useState(false);
  const [loadingBtn, setloadingBtn] = useState(false);

  async function onSubmit(values){
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloadingBtn(true);
    const res = await fund( taskId, values.weiAmount);
    if (res) {
      setOpen(false);
      alert("Task funded successfully");
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
              name="weiAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="weiAmount">Amount (wei)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="insert a value greater than 0" {...field} />
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