import { Button } from "./ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function TaskCard({ address, title, description, content }) {

  const navigate = useNavigate();

  function navigateStopPropagation(e, path) {
    e.stopPropagation();
    navigate(path);
  }

  return (
    <article
      className="rounded-lg outline-0 ring-primary transition duration-300
      hover:ring-2 focus:ring-2 cursor-pointer">
      
        <Card onClick={(e) => navigateStopPropagation(e, `/tasks/${address}`)}
          className="flex flex-col overflow-hidden rounded-lg border-2
          sm:h-60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-full flex-col overflow-ellipsis">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex grow items-center">
              {/* <p className="line-clamp-2">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium, est et! Excepturi culpa voluptas nihil deleniti ipsam facere consequatur atque.
              </p> */}
              <p>{content}</p>
            </CardContent>
            <CardFooter>
              <p>Card footer</p>
            </CardFooter>
          </div>
          <div className="flex justify-around gap-3 p-6 sm:flex-col">
            <Button onClick={(e) => navigateStopPropagation(e, "/mytasks")}>
              Fund
            </Button>
            <Button onClick={(e) => navigateStopPropagation(e, "/mytasks")}>
              Work
            </Button>
          </div>
        </Card>
    </article>
  );
}

export default TaskCard;
