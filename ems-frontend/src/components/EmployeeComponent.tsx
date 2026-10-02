import { useNavigate, useParams } from 'react-router-dom'
import EmployeeForm from './employees/EmployeeForm'
import { useEmployeeForm } from '../hooks/useEmployeeForm'

const EmployeeEditor = ({ id }: { id?: string }) => {
  const navigate = useNavigate()
  const form = useEmployeeForm(id, () => navigate('/employees'))

  return <EmployeeForm title={id ? 'Edit Employee' : 'Add Employee'} {...form} />
}

const EmployeeComponent = () => {
  const { id } = useParams<{ id: string }>()

  // Remount the editor when switching employees or opening the creation form.
  return <EmployeeEditor key={id ?? 'add'} id={id} />
}

export default EmployeeComponent
