import { NavLink } from "react-router-dom"

function Header() {
  return (
    <header className="header">
      <div className="header__content">
        <NavLink to={"/"} className={"logo"}>
          {/* <img src="logo.svg" alt="logo" /> */}
          <h2>Logo</h2>
        </NavLink>
      
      <nav className="nav">
        <ul className="nav__list">
          <li className="nav__item">
            <NavLink to={"mytasks"} className={"nav__link"}>My Tasks</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to={"#"} className={"btn"}>Account?</NavLink>
          </li>
        </ul>
      </nav>
      </div>
    </header>
  )
}

export default Header