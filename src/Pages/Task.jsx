import { useParams } from "react-router-dom";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

function Task() {
  const { id } = useParams();

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <h1>Task {id}</h1>
        <p>descrizione</p>
        <p className="grow">info</p>
        <div className="flex gap-3 justify-end">
          <Button>Fund</Button>
          <Button>Work</Button>
        </div>

      </Card>
    </section>
  );
}

export default Task;
