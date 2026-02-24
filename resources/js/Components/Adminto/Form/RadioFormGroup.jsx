import '../../../../css/form/custom-radio.css'

const RadioFormGroup = ({ className = 'mb-2', label, name, value = null, options, onChange = () => { }, uppercase = false }) => {
    return (
        <div className={`${className} custom-radio`}>
            <span className="form-label d-block mb-1">{label}</span>
            <div className="d-flex flex-wrap gap-1">
                {options.map((option) => {
                    const optionId = `${name}-${option.value}`
                    return <div key={option.value}>
                        <input
                            id={optionId}
                            className="form-check-input"
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange(option.value)}
                        />
                        <label className={`form-check-label ${uppercase ? 'text-uppercase' : ''}`} htmlFor={optionId}>{option.label}</label>
                    </div>
                })}
            </div>
        </div>
    )
}

export default RadioFormGroup