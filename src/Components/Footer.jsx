import { NavLink } from "react-router-dom";
import Container from "./ui/Container";

function Footer() {

  return (
    <footer className="mt-auto sm:flex sm:justify-between text-center py-6 px-4 border-t bg-background">
      <Container>
        <ul className="justify-normal">
          <li >
            <p>&copy; 2024 Blockchain Group </p>
          </li>
        </ul>
      </Container>
    </footer>
  );
}

export default Footer;
