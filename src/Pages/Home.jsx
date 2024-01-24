import InfoBar from "@/Components/InfoBar";
import TaskCard from "@/Components/TaskCard";

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
      <section className="flex flex-col gap-y-4 rounded-lg p-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description}
            content={task.content}
          />
        ))}
      </section>
    </>
  );
}

export default Home;
