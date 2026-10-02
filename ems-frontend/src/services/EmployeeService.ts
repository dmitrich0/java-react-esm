import axios from 'axios'

export interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
}

const REST_API_BASE_URL = '/api/employees'

export type EmployeeInput = Omit<Employee, 'id'>

export const listEmployees = (signal?: AbortSignal) =>
  axios.get<Employee[]>(REST_API_BASE_URL, { signal })

export const getEmployee = (id: string, signal?: AbortSignal) =>
  axios.get<Employee>(`${REST_API_BASE_URL}/${encodeURIComponent(id)}`, { signal })

export const createEmployee = (employee: EmployeeInput) =>
  axios.post<Employee>(REST_API_BASE_URL, employee)

export const updateEmployee = (id: string, employee: EmployeeInput) =>
  axios.put<Employee>(`${REST_API_BASE_URL}/${encodeURIComponent(id)}`, employee)

export const deleteEmployee = (id: number) =>
  axios.delete<void>(`${REST_API_BASE_URL}/${encodeURIComponent(id)}`)
