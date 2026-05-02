import React from 'react'

const MenuItem = ({ href, icon, badge = null, badgeColor = 'success', children, onClick, wrapText }) => {
  const isActive = location.pathname.startsWith(href)
  const autoWrapText = typeof children === 'string' && children.trim().length >= 20
  const allowWrap = wrapText ?? autoWrapText

  const Container = ({ className, children: content }) => {
    if (onClick) return <div onClick={onClick} className={className} style={{ cursor: 'pointer' }}>{content}</div>
    else return <a href={href} className={className}>{content}</a>
  }

  return <li className={`side-nav-item ${isActive ? 'active' : ''}`}>
    <Container className={`side-nav-link ${isActive ? 'active' : ''} ${allowWrap ? 'allow-wrap' : ''}`.trim()}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className={`menu-text ${allowWrap ? 'menu-text-wrap' : ''}`.trim()}>{children}</span>
      {
        badge && <span className={`badge bg-${badgeColor} rounded-pill`}>{badge}</span>
      }
    </Container>
  </li>
}

export default MenuItem
