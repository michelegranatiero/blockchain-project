import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/Components/ui/button"
import { useWeb3 } from '@/hooks/useWeb3';
import  { gweiToWei } from '@/utils/formatWeb3'


import {DialogClose, DialogFooter} from "@/Components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/Components/ui/form"
import { Input } from "@/Components/ui/input"
import { Textarea } from '@/Components/ui/textarea';
import { Loader2 } from "lucide-react"
import { useState } from 'react';



const taskSchema = z.object({
  title: z.coerce.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(100),
  descr: z.coerce.string().min(2).max(1000),
  numRounds: z.coerce.number().min(2).max(1000),
  workersPerRound: z.coerce.number().min(2).max(10000),
  entranceFee: z.coerce.number().refine((entranceFee) => {
    if (gweiToWei(entranceFee) >= 1) return true;
    return false;
  }, { message: "Entrance fee must be at least 1 wei (0.000000001 gwei)."}),
  file: z.instanceof(FileList).refine((file) => {
    if (file.length == 0 || !file) return false;
    return true;
  }),
})

function NewTaskForm({setOpenState, forceUpdate}) {

  const { createTask } = useWeb3();

  const [loadingBtn, setloadingBtn] = useState(false);

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      descr: "",
      numRounds: "",
      workersPerRound: "",
      entranceFee: "",
    },
  });

  const fileRef = form.register("file"); // fundamental for input file

  async function onSubmit(values) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    setloadingBtn(true);
    
    const response = await createTask(
      values.title, 
      values.descr, 
      values.numRounds, 
      values.workersPerRound, 
      gweiToWei(values.entranceFee), 
      values.file[0]
    );
    if (response){
      setOpenState(false);
      alert("Task created successfully");
      //window.location.reload();
      forceUpdate((k) => k + 1);
    } 
    else alert("Error creating task.");
    setloadingBtn(false);

    
  }

  const formFields = [
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "title",
    },
    {
      name: "descr",
      label: "Description",
      type: "textarea",
      placeholder: "description",
    },
    {
      name: "numRounds",
      label: "Number of Rounds",
      type: "number",
      placeholder: "4",
    },
    {
      name: "workersPerRound",
      label: "Number of Workers per Round",
      type: "number",
      placeholder: "4",
    },
    {
      name: "entranceFee",
      label: "Entrance Fee (Gwei)",
      type: "number",
      placeholder: "1",
    },

  ]

  return (

    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className='space-y-6'>
        {formFields.map((item) => (
          <FormField
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={item.name}>{item.label}</FormLabel>
                <FormControl>
                  {item.type === "textarea" ?
                    <Textarea placeholder={item.placeholder} {...field} className="resize-none"/> :
                    <Input type={item.type} placeholder={item.placeholder} {...field}/>
                  }
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="file">File</FormLabel>
                  <FormControl>
                    <Input type="file" {...fileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
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
          : <Button type="submit">Submit</Button>
          }
        </DialogFooter>
      </form>
    </Form>
  )
}

export default NewTaskForm