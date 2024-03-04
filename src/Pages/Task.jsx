import { useParams } from "react-router-dom";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { useWeb3 } from "@/hooks/useWeb3";
import { useEffect, useState } from "react";

function Task() {
  const { contract, getTask } = useWeb3();

  const { id } = useParams();

  const [task, setTask] = useState({});

  useEffect(() => {

    async function getDetails() {
      let tsk = await getTask(id);
      setTask(tsk);
    }
    if (contract) getDetails();
  }, [contract]);

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <h1>{task.title}</h1>
        <p>{task.description}</p>
        <p className="grow">{id}</p>
        <div className="flex gap-3 justify-end">
          <Button>Fund</Button>
          <Button>Work</Button>
        </div>

      </Card>
    </section>
  );
}

export default Task;
