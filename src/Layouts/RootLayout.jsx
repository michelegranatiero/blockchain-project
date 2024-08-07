import { Outlet, ScrollRestoration} from "react-router-dom";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { ThemeProvider } from "@/Components/ThemeProvider";
import Container from "@/Components/ui/Container";

function RootLayout() {
  return (
    <>
      
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Header />
        <Container className="flex min-h-full grow">
          <main className="m-4 w-full space-y-2 sm:m-6 lg:m-8 min-w-0">
            <ScrollRestoration />
            <Outlet />
          </main>
        </Container>
        <Footer />
      </ThemeProvider>
    </>
  );
}

export default RootLayout;
