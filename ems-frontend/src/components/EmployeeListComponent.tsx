import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteEmployee, listEmployees } from '../services/EmployeeService'
import type { Employee } from '../services/EmployeeService'

const ListEmployeesComponent = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const pendingDeletes = useRef(new Set<number>())

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

  const handleDelete = async (employee: Employee) => {
    if (pendingDeletes.current.size > 0) return

    pendingDeletes.current.add(employee.id)
    setDeletingIds(new Set(pendingDeletes.current))
    setDeleteError(null)

    let deleted = false

    try {
      await deleteEmployee(employee.id)
      deleted = true
      const { data } = await listEmployees()
      setEmployees(data)
    } catch {
      setDeleteError(deleted
        ? 'Employee deleted, but unable to refresh the list. Please reload the page.'
        : `Unable to delete ${employee.firstName} ${employee.lastName}. Please try again.`)
    } finally {
      pendingDeletes.current.delete(employee.id)
      setDeletingIds(new Set(pendingDeletes.current))
    }
  }

  return (
    <section className="employee-list" aria-labelledby="employees-heading">
      <h1 id="employees-heading" className="text-center">List of Employees</h1>
      <Link to="/employees/add" className="btn btn-primary mb-3">Add Employee</Link>
      {error ? <p className="alert alert-danger" role="alert">{error}</p> : null}
      {deleteError ? <p className="alert alert-danger" role="alert">{deleteError}</p> : null}
      <div className="table-responsive" aria-busy={loading}>
        <table className="table table-striped table-bordered employee-table" aria-labelledby="employees-heading">
          <thead>
            <tr>
              <th scope="col">Employee Id</th>
              <th scope="col">Employee First Name</th>
              <th scope="col">Employee Last Name</th>
              <th scope="col">Employee Email Id</th>
              <th scope="col">Actions</th>
              <th scope="col" className="text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center" role="status">Loading employees...</td>
              </tr>
            ) : error ? null : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">No employees found.</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.firstName}</td>
                  <td>{employee.lastName}</td>
                  <td>{employee.email}</td>
                  <td>
                    <Link to={`/employees/edit/${employee.id}`} className="btn btn-info"
                      aria-label={`Edit ${employee.firstName} ${employee.lastName}`}>Edit</Link>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      aria-label={`Delete ${employee.firstName} ${employee.lastName}`}
                      aria-busy={deletingIds.has(employee.id)}
                      disabled={deletingIds.size > 0}
                      onClick={() => handleDelete(employee)}
                    >
                      {deletingIds.has(employee.id) ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      ) : (
                        <span aria-hidden="true">×</span>
                      )}
                    </button>
                  </td>
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
