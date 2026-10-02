import './App.css'
import ListEmployeesComponent from './components/EmployeeListComponent'
import FooterComponent from './components/FooterComponent'
import HeaderComponent from './components/HeaderComponent'
import EmployeeComponent from './components/EmployeeComponent'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <HeaderComponent />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/employees" replace />} />
            <Route path="/employees" element={<ListEmployeesComponent />} />
            <Route path="/employees/add" element={<EmployeeComponent />} />
            <Route path="/employees/edit/:id" element={<EmployeeComponent />} />
          </Routes>
        </main>
        <FooterComponent />
      </div>
    </BrowserRouter>
  )
}

export default App
