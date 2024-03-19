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

  const [tasks, setTasks] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);

  const {wallet, contract, getAllTasksInfo, globFilters } = useWeb3();

  const [filters, setFilters] = globFilters;

  const [filteredTasks, setFilteredTasks] = useState([]); // PROVAAAAAAAAAAAAAAAAAAAAA

  // fetch all tasks and rerender on changes
  useEffect(() => {
    
    async function fetchData() {
      try {
        let tasks = await getAllTasksInfo();
        setTasks(tasks.reverse());
      } catch (error) {
        console.error("Error retriving tasks:", error);
      }
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
    const state = formatState(Number(task.state));
    return (filters.includes(state.toLowerCase()) ||
      (filters.includes("issuer") && task.amIssuer) ||
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
                id={task.id}
                title={task.title}
                description={task.description}
                state={task.state}
                regWorkers={task.registeredWorkers}
                forceUpd={[forceUpdate, setForceUpdate]}
              />
            ))
          : <h1 className="text-xl m-auto">No tasks found :&#40;</h1> }
        </section>
      </div>
      
    </>
  );
}

export default Home;
