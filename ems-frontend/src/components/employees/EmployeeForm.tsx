import { useId } from 'react'
import type { FormEventHandler } from 'react'
import { Link } from 'react-router-dom'
import type { EmployeeInput } from '../../services/EmployeeService'
import EmployeeFormField from './EmployeeFormField'

interface EmployeeFormProps {
  title: string
  values: EmployeeInput
  loading: boolean
  saving: boolean
  disabled: boolean
  error: string | null
  onFieldChange: (field: keyof EmployeeInput, value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

const EmployeeForm = ({
  title, values, loading, saving, disabled, error, onFieldChange, onSubmit,
}: EmployeeFormProps) => {
  const headingId = useId()

  return (
    <section className="container py-4" aria-labelledby={headingId}>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h1 id={headingId} className="h2 text-center mb-4">{title}</h1>
              {error ? <p className="alert alert-danger" role="alert">{error}</p> : null}
              {loading ? <p role="status">Loading employee...</p> : null}
              <form onSubmit={onSubmit} aria-busy={loading || saving}>
                <fieldset disabled={disabled}>
                  <legend className="visually-hidden">Employee details</legend>
                  <EmployeeFormField
                    name="firstName" label="First Name" autoComplete="given-name"
                    value={values.firstName} onChange={onFieldChange}
                  />
                  <EmployeeFormField
                    name="lastName" label="Last Name" autoComplete="family-name"
                    value={values.lastName} onChange={onFieldChange}
                  />
                  <EmployeeFormField
                    name="email" label="Email" type="email" autoComplete="email"
                    value={values.email} onChange={onFieldChange}
                  />
                  <button type="submit" className="btn btn-success">{saving ? 'Saving...' : 'Save'}</button>
                </fieldset>
                {saving ? <p role="status" className="mt-2">Saving employee...</p> : null}
              </form>
              <Link to="/employees" className="btn btn-secondary mt-3">Back to Employees</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmployeeForm
