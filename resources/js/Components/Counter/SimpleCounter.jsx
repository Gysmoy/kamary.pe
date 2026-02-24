import React from "react"

const SimpleCounter = ({quantity, title, className = 'text-primary'}) => {
  return <div className="card">
    <div className="card-body widget-user">
      <div className="text-center">
        <h2 className={`fw-normal ${className}`} data-plugin="counterup">{quantity}</h2>
        <h5>{title}</h5>
      </div>
    </div>
  </div>
}

export default SimpleCounter