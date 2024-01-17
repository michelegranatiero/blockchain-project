import { NavLink } from "react-router-dom"

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <ul className="footer__list">
          <li className="footer__item">
            <NavLink to={"#"} className={"footer__link"}>&copy; 2024 Blockchain Group </NavLink>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default Footer