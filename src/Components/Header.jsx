import { NavLink } from "react-router-dom";
import Container from "./ui/Container";
import { Button } from "@/components/ui/button";
import ProfileButton from "@/components/ui/ProfileButton";
import { Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";

import { useMetaMask } from "@/hooks/useMetaMask";

/* const NavLinks = ({closeNav}) => {
  return (
    <>
      <li className={styles.nav__item}>
        <NavLink to={"mytasks"} className={styles.nav__link} onClick={closeNav}>My Tasks</NavLink>
      </li>
      <li className={styles.nav__item}>
        <NavLink to={"#"} className={styles.btn} onClick={closeNav}>Account?</NavLink>
      </li>
    </>
  )
} */
const routes = [
  {
    path: "mytasks",
    name: "My Tasks",
  },
];

function Header() {
  const { theme, setTheme } = useTheme();

  const { wallet } = useMetaMask();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/75 px-4 py-3 backdrop-blur sm:flex sm:justify-between">
      <Container>
        <div className="ms:px-6 relative flex h-12 w-full items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Menu className="h-6 w-6 md:hidden" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetClose asChild>
                  <NavLink to={"/"} className="px-2 pb-4">
                    <h1 className="text-2xl font-bold">Logo</h1>
                  </NavLink>
                </SheetClose> 
                <nav className="flex flex-col gap-4">
                  {routes.map((route, i) => (
                    <SheetClose asChild key={i}>
                      <NavLink
                        to={route.path}
                        className="block border-b px-2 py-1 text-lg">
                        {route.name}
                      </NavLink>
                    </SheetClose>
                  ))}
                  {wallet.accounts.length > 0 && (
                    <SheetClose asChild>
                    <Button asChild variant="outline">
                      <NavLink
                        to={"account"}
                        className="text-sm font-medium transition-colors">
                        Account
                      </NavLink>
                    </Button>
                  </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <NavLink to={"/"} className="ml-4 lg:ml-0">
              <h1 className="text-2xl font-bold">Logo</h1>
            </NavLink>
          </div>
          <nav className="mx-6 hidden items-center space-x-4 md:block lg:space-x-6">
            {routes.map((route, i) => (
              <Button key={i} asChild variant="Link">
                <NavLink
                  to={route.path}
                  className="text-sm font-medium transition-colors">
                  {route.name}
                </NavLink>
              </Button>
            ))}
            {wallet.accounts.length > 0 && (
              <Button asChild variant="Link">
              <NavLink
                to={"account"}
                className="text-sm font-medium transition-colors">
                Account
              </NavLink>
            </Button>
            )}
          </nav>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-6"
              aria-label="Toggle Theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:-rotate-0 dark:scale-100" />
              <span className="sr-only"> Toggle Theme</span>
            </Button>
            <ProfileButton />
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Header;
