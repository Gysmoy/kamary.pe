const PriceAdvisor = ({ suggested: suggestedPrice = 0, price = 0, fullWidth = false }) => {
    const diff = (Number(price) - suggestedPrice) / suggestedPrice;

    let className = 'border-primary bg-[#E8F5FF] text-primary'
    let icon = 'mdi-minus'
    let tag = 'Precio competitivo'

    if (diff <= -0.05) {
        className = 'border-green-500 bg-green-50 text-green-600';
        icon = 'mdi-arrow-top-right';
        tag = 'Se vende más rápido';
    }
    if (diff >= 0.10) {
        className = 'border-red-500 bg-red-50 text-red-600';
        icon = 'mdi-arrow-bottom-right';
        tag = 'Se vende más lento';
    }

    return <span className={`block ${fullWidth ? 'w-full' : 'w-max'} p-2 text-xs border rounded ${className}`}>
        <i className={`mdi me-1 ${icon}`} />
        <span>{tag}</span>
    </span>
}

export default PriceAdvisor