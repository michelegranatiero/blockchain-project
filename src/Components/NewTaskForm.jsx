import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { useWeb3 } from '@/hooks/useWeb3';

import {DialogClose, DialogFooter} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"



const taskSchema = z.object({
  title: z.coerce.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(50),
  descr: z.coerce.string().min(2).max(50),
  numRounds: z.coerce.number().min(2).max(1000),
  numWorkers: z.coerce.number().min(2).max(10000),
  //numworkers should be greater than numrounds (also on smart contract)
})

function NewTaskForm({setOpenState}) {

  const { deployTask } = useWeb3();

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
    const response = await deployTask(values.title, values.descr, values.numRounds, values.numWorkers);
    if (response){
      setOpenState(false);
      alert("Task deployed successfully");
      window.location.reload();
    } 
    else alert("Error deploying task.");
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
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button type="submit">Submit</Button>
        </DialogFooter>
          
        {/* </div> */}

      </form>
    </Form>
  )
}

export default NewTaskForm