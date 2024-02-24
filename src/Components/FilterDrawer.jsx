import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { LuSettings2 } from "react-icons/lu";

import { useMetaMask } from "@/hooks/useMetaMask";

function FilterDrawer() {

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
            <ToggleGroupItem value="completed" aria-label="Toggle completed">
              <span>completed</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="in progress"
              aria-label="Toggle in progress">
              <span>in progress</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="pending" aria-label="Toggle pending">
              <span>pending</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="canceled" aria-label="Toggle canceled">
              <span>canceled</span>
            </ToggleGroupItem>
          </div>
          {wallet.accounts.length > 0 && (
            <div className="flex flex-col items-stretch gap-1">
            <h4 className="mb-2 text-sm font-medium leading-none">My Role</h4>
            <ToggleGroupItem value="issuer" aria-label="Toggle issuer">
              <span>issuer</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="funder" aria-label="Toggle funder">
              <span>funder</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="worker" aria-label="Toggle worker">
              <span>worker</span>
            </ToggleGroupItem>
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
