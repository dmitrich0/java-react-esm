import axios from 'axios'

export interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
}

const REST_API_BASE_URL = '/api/employees'

export const listEmployees = (signal?: AbortSignal) =>
  axios.get<Employee[]>(REST_API_BASE_URL, { signal })
