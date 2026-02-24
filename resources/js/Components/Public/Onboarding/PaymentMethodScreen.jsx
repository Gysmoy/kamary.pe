import { useState } from "react";

const PaymentMethodScreen = ({ accountType, setAccountType, accountNumber, setAccountNumber, accountCci, setAccountCci, holderName, setHolderName, goBack, onSubmit }) => {
    // const [accountType, setAccountType] = useState("cci");

    const handleAccountTypeChange = (e) => {
        setAccountType(e.target.value);
        setAccountNumber("");
        setAccountCci("");
    };

    const getLabelAndPlaceholder = () => {
        if (accountType === "cci") {
            return {
                label: "Número de cuenta",
                placeholder: "Ingresa tu número de cuenta"
            };
        } else {
            return {
                label: "Número de celular del Yape / Plin",
                placeholder: "Ingresa tu número de celular"
            };
        }
    };

    const { label, placeholder } = getLabelAndPlaceholder();

    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-start">Configura cómo quieres cobrar</h4>
            <p className='text-start w-full text-gray-600'>Usamos estos datos solo para depositarte. No se comparten con compradores.</p>
        </div>
        <form onSubmit={onSubmit} className="text-start" >
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tipo de cuenta <span className="text-[#FB2C36]">*</span></label>
                <div className="grid grid-cols-1 gap-3">
                    <label className="group flex gap-4 items-start p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-primary transition has-[:checked]:border-primary">
                        <input
                            type="radio"
                            name="accountType"
                            className="peer mt-1 w-4 h-4"
                            value="cci"
                            checked={accountType === "cci"}
                            onChange={handleAccountTypeChange}
                            required
                        />
                        <div className="flex flex-col">
                            <span className="group-has-[:checked]:text-primary">Cuenta bancaria (CCI)</span>
                            <small className="text-sm text-silver">Recibe transferencias interbancarias</small>
                        </div>
                    </label>
                    <label className="group flex gap-4 items-start p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-primary transition has-[:checked]:border-primary">
                        <input
                            type="radio"
                            name="accountType"
                            className="peer mt-1 w-4 h-4"
                            value="wallet"
                            checked={accountType === "wallet"}
                            onChange={handleAccountTypeChange}
                            required
                        />
                        <div className="flex flex-col">
                            <span className="group-has-[:checked]:text-primary">Yape / Plin</span>
                            <small className="text-sm text-silver">Recibe pagos en tu billetera digital</small>
                        </div>
                    </label>
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="accountNumber">
                    {label} <span className="text-[#FB2C36]">*</span>
                </label>
                <input
                    type="number"
                    id="accountNumber"
                    name="accountNumber"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder={placeholder}
                    required
                />
            </div>
            {
                accountType == 'cci' &&
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" htmlFor="accountCci">
                        Número de cuenta CCI (20 dígitos) <span className="text-[#FB2C36]">*</span>
                    </label>
                    <input
                        type="number"
                        id="accountCci"
                        name="accountCci"
                        value={accountCci}
                        onChange={e => setAccountCci(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder='Ingresa tu número CCI'
                        required
                    />
                </div>
            }
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="holderName">Nombre del titular <span className="text-[#FB2C36]">*</span></label>
                <input
                    type="text"
                    id="holderName"
                    name="holderName"
                    value={holderName.toUpperCase()}
                    onChange={e => setHolderName(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Ingresa nombres y apellidos del titular"
                    required
                />
            </div>
            <div className='bg-[#E8F5FF] text-xs p-2 rounded mb-8 flex gap-2'>
                <i className="mdi mdi-information-outline text-primary"></i>
                Depositamos el monto de cada venta luego de que el comprador confirma el recojo exitoso o luego de 72 horas si no hay reclamos.
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button className="block w-full text-center py-3 px-4 text-sm border border-primary text-primary rounded-lg hover:opacity-80" type="button"
                onClick={goBack}>
                    Atrás
                </button>
                <button
                    className="w-full py-3 px-4 text-sm bg-primary text-white rounded-lg hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={!accountNumber || !holderName}
                >
                    Continuar
                </button>
            </div>
        </form>
    </>
}

export default PaymentMethodScreen