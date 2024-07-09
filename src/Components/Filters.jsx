import { ToggleGroup, ToggleGroupItem } from "@/Components/ui/toggle-group";
import { useEffect, useState } from "react";
import FilterDrawer from "./FilterDrawer";

import { useMetaMask } from "@/hooks/useMetaMask";
import { useWeb3 } from "@/hooks/useWeb3";

function Filters({ className = "" }) {
  
  const { wallet } = useMetaMask();
  const { globFilters } = useWeb3();
  
  
  const stateFilters = ["deployed", "started", "completed"];
  const roleFilters = ["admin", "funder", "worker"];


  const [filters, setFilters] = globFilters;

  return (
    <ToggleGroup
      type="multiple" variant="outline" defaultValue={filters}
      onValueChange={(value) => setFilters(value)}
      className={`flex-col items-start justify-start self-stretch ${className}`}>
      <div className="px-4 md:hidden">
        <FilterDrawer stateFilters={stateFilters} roleFilters={roleFilters} />
      </div>
      <aside className="sticky top-14 hidden flex-col gap-y-4 whitespace-nowrap p-4 text-zinc-500 md:flex ">
        <h3 className="mt-4 border-b-2 pb-2 text-lg font-medium leading-none">
          Filters
        </h3>
        <div className="flex flex-col items-stretch gap-1">
          <h4 className="mb-2 text-sm font-medium leading-none">State</h4>
          {stateFilters.map((state) => (
            <ToggleGroupItem
              key={state}
              value={state.toLowerCase()}
              aria-label={`Toggle ${state.toLowerCase()}`}>
              <span>{state}</span>
            </ToggleGroupItem>
          ))}
        </div>
        {wallet.accounts.length > 0 ? (
          <div className="flex flex-col items-stretch gap-1">
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
        ): null}
      </aside>
    </ToggleGroup>
  );
}

export default Filters;
