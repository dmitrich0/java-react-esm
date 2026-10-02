import { useId } from 'react'
import type { EmployeeInput } from '../../services/EmployeeService'

interface EmployeeFormFieldProps {
  name: keyof EmployeeInput
  label: string
  type?: 'text' | 'email'
  autoComplete: string
  value: string
  onChange: (field: keyof EmployeeInput, value: string) => void
}

const EmployeeFormField = ({
  name,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
}: EmployeeFormFieldProps) => {
  const id = useId()

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        name={name}
        className="form-control"
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  )
}

export default EmployeeFormField
