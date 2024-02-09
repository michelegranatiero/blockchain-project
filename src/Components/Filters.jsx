import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEffect, useState } from "react"

function Filters() {

  const [filter, setFilter] = useState(["in progress", "pending"]);

  useEffect(() => {
    console.log(filter)
  }, [filter]);

  return (
    <>
      <aside className="p-4 text-zinc-600 sticky top-10 hidden md:block">
        <div className="flex flex-col gap-y-4 p-4 whitespace-nowrap rounded-lg">
          <h3 className="mt-4 pb-2 text-lg font-medium leading-none border-b-2">
            Filters
          </h3>
          <ToggleGroup type="multiple" variant="outline" defaultValue={filter} 
            onValueChange={(value) => setFilter(value)}
            className="flex flex-col items-stretch">
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
          </ToggleGroup>
          <ToggleGroup type="multiple" variant="outline" defaultValue={filter} 
            onValueChange={(value) => setFilter(value)}
            className="flex flex-col items-stretch">
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
          </ToggleGroup>
        </div>
        
      </aside>
      
    </>
  )
}

export default Filters