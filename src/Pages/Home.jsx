import InfoBar from "@/Components/InfoBar";
import TaskCard from "@/Components/TaskCard";
import Filters from "@/Components/Filters";
import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";

import  { formatState } from '@/utils/formatWeb3'

function Home() {

  const {wallet, contract, getAllTasks, globFilters, setHomeEvents } = useWeb3();

  const [filters, setFilters] = globFilters;

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  
  const [forceUpdate, setForceUpdate] = useState(0);

  // fetch all tasks and re-render on changes
  // every time a task changes this entire page should be re-rendered because of the filters
  useEffect(() => {
    async function fetchData() {      
      let tasks = await getAllTasks();      
      if (tasks && tasks.length > 0) setTasks(tasks.reverse());
      setLoading(false);
    }
    if (contract) fetchData();
    else {
      const timeout = setTimeout(() => {
        if (!contract && loading) setLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }

  }, [contract, wallet, forceUpdate]);

  // EVENTS
  useEffect(() => {
    if (!contract) return;
    const cleanUpFunct = setHomeEvents(setForceUpdate);
    
    if (cleanUpFunct) return () => cleanUpFunct();
  }, [contract, wallet]);

  // filter tasks when filters or tasks change
  useEffect(() => {
    setFilteredTasks(tasks.filter((task) => {
      return filterFunction(task);
    }));
  }, [filters, tasks]);



  function filterFunction(task) {
    const formattedState = formatState(Number(task.state)).toLowerCase();
    const roleFilters = ["admin", "funder", "worker"];
    
    // Check if any of the roleFilters are included in filters
    const includesAnyRole = roleFilters.some(role => filters.includes(role));
    
    return (
      filters.includes(formattedState) && (
        (filters.includes("admin") && task.amAdmin) ||
        (filters.includes("funder") && task.amFunder) ||
        (filters.includes("worker") && task.amWorker) || 
        !includesAnyRole
      )
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
