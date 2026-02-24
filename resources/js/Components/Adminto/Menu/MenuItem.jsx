import React from 'react'
import { Link } from '@inertiajs/react'

const MenuItem = ({ href, icon, badge = null, children }) => {
  const isActive = location.pathname.startsWith(href)
  
  return <li className={`side-nav-item ${isActive ? 'active' : ''}`}>
    <a href={href} className={`side-nav-link ${isActive ? 'active' : ''}`}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className="menu-text">{children}</span>
      {
        badge && <span className="badge bg-danger rounded-pill">{badge}</span>
      }
    </a>
  </li>
}

export default MenuItem