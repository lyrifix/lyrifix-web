import MultipleSelector from "~/components/ui/multiselect";
import type { Option } from "~/components/ui/multiselect";

interface MultiselectArtistsProps {
  defaultOptions: Option[];
  artistOptions: Option[];
  handleChangeArtistOptions: (options: Option[]) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function MultiselectArtists({
  defaultOptions,
  artistOptions,
  handleChangeArtistOptions,
  placeholder,
  className,
}: MultiselectArtistsProps) {
  const onSearchSync = (value: string) =>
    defaultOptions.filter((option) =>
      option.label.toLowerCase().includes(value.toLowerCase()),
    );

  return (
    <div className="*:not-first:mt-2">
      <MultipleSelector
        defaultOptions={defaultOptions}
        value={artistOptions}
        onChange={handleChangeArtistOptions}
        className={className}
        placeholder={placeholder || "Select artists"}
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
        commandProps={{ label: "Select artists", shouldFilter: false }}
        onSearchSync={onSearchSync}
        triggerSearchOnFocus={true}
      />
    </div>
  );
}
