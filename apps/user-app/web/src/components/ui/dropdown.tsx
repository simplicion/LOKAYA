import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DropdownOption {
  label: string
  value: string
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

export const Dropdown = React.forwardRef<HTMLButtonElement, DropdownProps>(
  ({ options, value, onChange, placeholder = "Select an option", disabled, className, id, name }, ref) => {
    return (
      <Select
        value={value}
        items={options}
        onValueChange={(val: any) => onChange?.(val)}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger ref={ref} className={className} id={id}>
          <SelectValue placeholder={placeholder}>
            {(val: any) => {
              if (!val) return placeholder;
              const opt = options.find((o) => o.value === val || o.label === val);
              return opt ? opt.label : val;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)
Dropdown.displayName = "Dropdown"
