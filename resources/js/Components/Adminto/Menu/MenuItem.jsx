import React from 'react'
import { Link } from '@inertiajs/react'

const MenuItem = ({ href, icon, badge = null, badgeColor = 'success', children, onClick }) => {
  const isActive = location.pathname.startsWith(href)

  const Container = ({ className, children: content }) => {
    if (onClick) return <div onClick={onClick} className={className} style={{ cursor: 'pointer' }}>{content}</div>
    else return <a href={href} className={className}>{content}</a>
  }

  return <li className={`side-nav-item ${isActive ? 'active' : ''}`}>
    <Container className={`side-nav-link ${isActive ? 'active' : ''}`}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className="menu-text">{children}</span>
      {
        badge && <span className={`badge bg-${badgeColor} rounded-pill`}>{badge}</span>
      }
    </Container>
  </li>
}

export default MenuItem