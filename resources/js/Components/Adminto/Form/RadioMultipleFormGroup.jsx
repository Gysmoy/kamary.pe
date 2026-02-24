import '../../../../css/form/custom-radio.css'

const RadioMultipleFormGroup = ({ className = 'mb-2', label, name, value = [], options, onChange = () => { }, uppercase = false, maxSelected = null }) => {
    const isChecked = (optionValue) => Array.isArray(value) && value.includes(optionValue);
    const canCheckMore = maxSelected === null || (Array.isArray(value) && value.length < maxSelected);

    const handleChange = (optionValue) => {
        const newValue = isChecked(optionValue)
            ? value.filter(v => v !== optionValue)
            : canCheckMore
                ? [...value, optionValue]
                : value;
        onChange(newValue);
    };

    return (
        <div className={`${className} custom-checkbox`}>
            <label className="form-label d-block mb-1">{label}</label>
            <div className="d-flex flex-wrap gap-1">
                {options.map((option) => {
                    const checked = isChecked(option.value);
                    const disabled = !checked && !canCheckMore;
                    const optionId = `${name}-${option.value}`
                    return <div key={option.value}>
                        <input
                            className={`form-check-input ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            type="checkbox"
                            name={name}
                            id={optionId}
                            value={option.value}
                            checked={checked}
                            onChange={() => handleChange(option.value)}
                            disabled={disabled}
                        />
                        <label className={`form-check-label ${uppercase ? 'text-uppercase' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} htmlFor={optionId}>{option.label}</label>
                    </div>
                })}
            </div>
        </div>
    )
}

export default RadioMultipleFormGroup