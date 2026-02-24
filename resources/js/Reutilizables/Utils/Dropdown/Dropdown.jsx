import { useEffect, useRef, useState } from "react";

const Dropdown = ({ options, value, onSelect, children, renderItem = (item) => item.label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return <div className="relative" ref={dropdownRef}>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 px-4 border border-gray-300 rounded-lg bg-white flex items-center justify-between min-w-[160px]"
        >
            <span>{options.find(opt => opt.value === value)?.label || 'Seleccionar'}</span>
            <i className={`ti ti-chevron-down ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>
        {isOpen && (
            <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {options.map((option) => (
                    <li
                        key={option.value}
                        onClick={() => {
                            onSelect(option.value);
                            setIsOpen(false);
                        }}
                        className="py-2 px-4 hover:bg-gray-100 cursor-pointer text-nowrap"
                    >
                        {renderItem(option)}
                    </li>
                ))}
            </ul>
        )}
    </div>
}

export default Dropdown;