import Number2Currency from "../../../Utils/Number2Currency"
import { useBase } from "../../Tailwind/BaseContext"

const CheckoutSummary = ({
    onPrevClicked = () => { }, onNextClicked = () => { },
    showPrevButton = true, showNextButton = true,
    prevButtonText = 'Regresar', nextButtonText = 'Continuar',
    disablePrevButton = false, disableNextButton = false,
    children
}) => {
    const { totalAmount } = useBase()

    return <>
        <h4 className='text-center text-lg font-bold'>Resumen del pedido</h4>
        <div className='space-y-2'>
            <div className='flex justify-between items-center'>
                <span className='block text-sm'>Subtotal</span>
                <span className='block'>S/ {Number2Currency(totalAmount)}</span>
            </div>
            <div className='flex justify-between items-center'>
                <span className='block text-sm'>Protección y procesamiento</span>
                <span className='block'>S/ {Number2Currency(0)}</span>
            </div>
        </div>
        <hr />
        <div className='flex justify-between items-center'>
            <span className='block text-lg font-semibold'>Total</span>
            <span className='block text-2xl font-semibold text-primary'>S/ {Number2Currency(totalAmount)}</span>
        </div>
        <div>{children}</div>
        <div className={`grid ${(!showPrevButton || !showNextButton) ? '' : 'grid-cols-2'} gap-2.5`}>
            {
                showPrevButton &&
                <button
                    onClick={onPrevClicked}
                    disabled={disablePrevButton}
                    className="block w-full text-center py-3 px-4 text-sm border border-primary text-primary rounded-lg hover:opacity-80"
                    type="button">
                    {prevButtonText}
                </button>
            }
            {
                showNextButton &&
                <button
                    onClick={onNextClicked}
                    disabled={disableNextButton}
                    className='block w-full py-2.5 px-4 text-sm text-center border border-primary bg-primary text-white rounded-lg disabled:opacity-50 font-medium'
                >
                    {nextButtonText}
                </button>
            }
        </div>
    </>
}

export default CheckoutSummary