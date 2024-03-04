import InfoBar from "@/Components/InfoBar";
import TaskCard from "@/Components/TaskCard";
import Filters from "@/Components/Filters";
import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";

/* const tasks = [
  {
    address: 0x1234,
    title: "Task 1",
    description: "Description task 1",
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam fuga totam quam id sunt officia at dolores quia quis adipisci!",
  },
]; */


function Home() {

  const [tasks, setTasks] = useState([]);

  const { contract, getAllTasks } = useWeb3();

  useEffect(() => {
    async function fetchData() {
      let tasks = await getAllTasks();
      setTasks(tasks.reverse());
    }
    if (contract) fetchData();
    
  }, [contract]);

  return (
    <>
      <InfoBar pageName="Tasks"/>
      <div className="flex flex-col md:flex-row md:items-start ">
        <Filters />
        <section className="flex flex-col gap-y-4 p-4 h-full w-full">
          {tasks.length > 0 ?
            tasks.map((task) => (
              <TaskCard
                key={task.address}
                address={task.address}
                title={task.title}
                description={task.description}
                content={task.content}
              />
            ))
          : <h1 className="text-xl m-auto">No tasks found :&#40;</h1> }
        </section>
      </div>
      
    </>
  );
}

export default Home;
