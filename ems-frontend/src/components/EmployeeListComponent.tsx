export interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface ListEmployeesComponentProps {
  employees?: readonly Employee[]
}

// Temporary sample data until the backend is connected.
const sampleEmployees: readonly Employee[] = [
  { id: 1, firstName: 'Ramesh', lastName: 'Fadatare', email: 'ramesh@gmail.com' },
  { id: 2, firstName: 'Umesh', lastName: 'Fadatare', email: 'umesh@gmail.com' },
  { id: 3, firstName: 'Rajkumar', lastName: 'Fadatare', email: 'rajkumar@gmail.com' },
]

const ListEmployeesComponent = ({
  employees = sampleEmployees,
}: ListEmployeesComponentProps) => {
  return (
    <section className="employee-list" aria-labelledby="employees-heading">
      <h1 id="employees-heading" className="text-center">List of Employees</h1>
      <div className="table-responsive">
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
            {employees.length === 0 ? (
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
