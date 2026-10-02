import { Link } from 'react-router-dom'

const HeaderComponent = () => {
  return (
    <header>
      <nav className="navbar navbar-dark bg-dark" aria-label="Main navigation">
        <div className="container-fluid">
          <Link className="navbar-brand text-wrap" to="/employees">Employee Management System</Link>
        </div>
      </nav>
    </header>
  )
}

export default HeaderComponent
