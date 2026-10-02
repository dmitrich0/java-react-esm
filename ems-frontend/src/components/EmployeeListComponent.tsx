import { useEffect, useState } from 'react'
import { listEmployees } from '../services/EmployeeService'
import type { Employee } from '../services/EmployeeService'

const ListEmployeesComponent = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    listEmployees(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setEmployees(response.data)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Unable to load employees. Please try again later.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="employee-list" aria-labelledby="employees-heading">
      <h1 id="employees-heading" className="text-center">List of Employees</h1>
      {error ? <p className="alert alert-danger" role="alert">{error}</p> : null}
      <div className="table-responsive" aria-busy={loading}>
        <table className="table table-striped table-bordered employee-table" aria-labelledby="employees-heading">
          <thead>
            <tr>
              <th scope="col">Employee Id</th>
              <th scope="col">Employee First Name</th>
              <th scope="col">Employee Last Name</th>
              <th scope="col">Employee Email Id</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center" role="status">Loading employees...</td>
              </tr>
            ) : error ? null : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center">No employees found.</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.firstName}</td>
                  <td>{employee.lastName}</td>
                  <td>{employee.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ListEmployeesComponent
