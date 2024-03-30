import InfoBar from "@/Components/InfoBar";
import TaskCard from "@/Components/TaskCard";
import Filters from "@/Components/Filters";
import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";

import  { formatState } from '@/utils/formatWeb3'

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

  const {wallet, contract, getAllTasks, globFilters } = useWeb3();

  const [filters, setFilters] = globFilters;

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  
  const [forceUpdate, setForceUpdate] = useState(0);

  // fetch all tasks and re-render on changes
  // every time a task changes this entire page should be re-rendered because of the filters
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let tasks = await getAllTasks();
      if (tasks.length > 0) setTasks(tasks.reverse());
      else setLoading(false);
    }
    if (contract) fetchData();
    
  }, [contract, wallet, forceUpdate]);

  // filter tasks when filters or tasks change
  useEffect(() => {
    setFilteredTasks(tasks.filter((task) => {
      return filterFunction(task);
    }));
  }, [filters, tasks]);

  function filterFunction(task) {
    return (
      filters.includes(formatState(Number(task.state)).toLowerCase()) ||
      (filters.includes("admin") && task.amAdmin) ||
      (filters.includes("funder") && task.amFunder) ||
      (filters.includes("worker") && task.amWorker)
    );
  }

  return (
    <>
      <InfoBar pageName="Tasks" forceUpdate={setForceUpdate}/>
      <div className="flex flex-col md:flex-row md:items-start">
        <Filters/>
        <section className="flex flex-col gap-y-4 p-4 h-full w-full min-w-0 ">
          {filteredTasks.length > 0 ?
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task = {task}
                forceUpd={[forceUpdate, setForceUpdate]}
              />
            ))
          : <h1 className="text-xl m-auto"> 
              {loading ? "Loading..." : "No tasks found 😞"}
            </h1>}
        </section>
      </div>
      
    </>
  );
}

export default Home;
