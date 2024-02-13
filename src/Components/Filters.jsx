import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEffect, useState } from "react"
import FilterDrawer from "./FilterDrawer"

function Filters({className = ""}) {

  const [filter, setFilter] = useState(["in progress", "pending"]);

  useEffect(() => {
    console.log(filter)
  }, [filter]);

  return (
    <ToggleGroup type="multiple" variant="outline" defaultValue={filter} 
      onValueChange={(value) => setFilter(value)}
      className={`flex-col self-stretch justify-start items-start ${className}`}>
      <div className="px-4 md:hidden">
        <FilterDrawer />
      </div>
      <aside className="p-4 text-zinc-600  hidden md:flex flex-col gap-y-4 whitespace-nowrap sticky top-14 ">
          <h3 className="mt-4 pb-2 text-lg font-medium leading-none border-b-2">
            Filters
          </h3>
          <div
            className="flex flex-col items-stretch gap-1">
            <h4 className="mb-2 text-sm font-medium leading-none">State</h4>
            <ToggleGroupItem value="completed" aria-label="Toggle completed">
              <span>completed</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="in progress" aria-label="Toggle in progress">
            <span>in progress</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="pending" aria-label="Toggle pending">
            <span>pending</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="canceled" aria-label="Toggle canceled">
            <span>canceled</span>
            </ToggleGroupItem>
          </div>
          <div
            className="flex flex-col items-stretch gap-1">
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
        
      </aside>
      
    </ToggleGroup>
  )
}

export default Filters