import InfoBar from "@/Components/InfoBar";
import TaskCard from "@/Components/TaskCard";
import Filters from "@/Components/Filters";

const tasks = [
  {
    id: 1,
    title: "Task 1",
    description: "Description task 1",
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam fuga totam quam id sunt officia at dolores quia quis adipisci!",
  },
  {
    id: 2,
    title: "Task 2",
    description: "Description task 2",
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam fuga totam quam id sunt officia at dolores quia quis adipisci!",
  },
  {
    id: 3,
    title: "Task 3",
    description: "Description task 3",
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam fuga totam quam id sunt officia at dolores quia quis adipisci!",
  },
];

function Home() {
  return (
    <>
      <InfoBar pageName="Tasks"/>
      <div className="md:flex md:items-start">
        <Filters />
        <section className="flex flex-col gap-y-4 p-4 h-full">
          {tasks.length > 0 ?
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
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
