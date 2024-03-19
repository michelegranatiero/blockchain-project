import { Button } from "@/Components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/Components/ui/drawer";
import { ToggleGroupItem } from "@/Components/ui/toggle-group";
import { LuSettings2 } from "react-icons/lu";

import { useMetaMask } from "@/hooks/useMetaMask";

function FilterDrawer({stateFilters, roleFilters}) {

  const { wallet } = useMetaMask();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2 text-zinc-500 text-md">
          <div> Filters </div>
          <LuSettings2 size={20}/>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto flex flex-col w-full max-w-sm p-4 mb-4 whitespace-nowrap ">
          <DrawerHeader className="sm:text-center">
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col items-stretch gap-1 p-4 text-zinc-500">
            <h4 className="mb-2 text-sm font-medium leading-none ">State</h4>
            {stateFilters.map((state) => (
              <ToggleGroupItem
                key={state}
                value={state.toLowerCase()}
                aria-label={`Toggle ${state.toLowerCase()}`}>
                <span>{state}</span>
              </ToggleGroupItem>
            ))}
          </div>
          {wallet.accounts.length > 0 && (
            <div className="flex flex-col items-stretch gap-1 p-4">
            <h4 className="mb-2 text-sm font-medium leading-none">My Role</h4>
            {roleFilters.map((role) => (
              <ToggleGroupItem
                key={role}
                value={role.toLowerCase()}
                aria-label={`Toggle ${role.toLowerCase()}`}>
                <span>{role}</span>
              </ToggleGroupItem>
            ))}
          </div>
          )}
          <DrawerFooter>
            {/* <Button>Submit</Button> */}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default FilterDrawer;
