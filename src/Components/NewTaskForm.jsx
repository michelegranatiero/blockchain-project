import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/Components/ui/button"
import { useWeb3 } from '@/hooks/useWeb3';

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
import { Loader2 } from "lucide-react"
import { useState } from 'react';



const taskSchema = z.object({
  title: z.coerce.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(32),
  descr: z.coerce.string().min(2).max(1000),
  numRounds: z.coerce.number().min(2).max(1000),
  numWorkers: z.coerce.number().min(2).max(10000),
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
      numWorkers: "",
    },
  });

  async function onSubmit(values) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloadingBtn(true);
    const response = await createTask(values.title, values.descr, values.numRounds, values.numWorkers);
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
      type: "text",
      placeholder: "description",
    },
    {
      name: "numRounds",
      label: "Number of Rounds",
      type: "number",
      placeholder: "4",
    },
    {
      name: "numWorkers",
      label: "Number of Workers",
      type: "number",
      placeholder: "16",
    },
  ]

  return (

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
                  <Input type={item.type} placeholder={item.placeholder} {...field} />
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
          : <Button type="submit">Submit</Button>
          }
          
        </DialogFooter>
          
        {/* </div> */}

      </form>
    </Form>
  )
}

export default NewTaskForm