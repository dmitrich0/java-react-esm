import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createEmployee, getEmployee, updateEmployee } from '../services/EmployeeService'
import type { EmployeeInput } from '../services/EmployeeService'

type LoadStatus = 'loading' | 'ready' | 'error'

export const useEmployeeForm = (id: string | undefined, onSaved: () => void) => {
  const [values, setValues] = useState<EmployeeInput>({ firstName: '', lastName: '', email: '' })
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(id ? 'loading' : 'ready')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    getEmployee(id, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return

        setValues({ firstName: data.firstName, lastName: data.lastName, email: data.email })
        setLoadStatus('ready')
      })
      .catch(() => {
        if (controller.signal.aborted) return

        setError('Unable to load this employee. Please return to the list and try again.')
        setLoadStatus('error')
      })

    return () => controller.abort()
  }, [id])

  const onFieldChange = (field: keyof EmployeeInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || loadStatus !== 'ready') return

    const employee: EmployeeInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    }

    if (!employee.firstName || !employee.lastName || !employee.email) {
      setError('First name, last name and email are required.')
      return
    }

    submitting.current = true
    setSaving(true)
    setError(null)

    try {
      if (id) await updateEmployee(id, employee)
      else await createEmployee(employee)
      onSaved()
    } catch {
      setError('Unable to save the employee. Please try again.')
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return {
    values,
    loading: loadStatus === 'loading',
    disabled: loadStatus !== 'ready' || saving,
    saving,
    error,
    onFieldChange,
    onSubmit,
  }
}
