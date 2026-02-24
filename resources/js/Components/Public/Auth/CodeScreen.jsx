import { useEffect, useRef, useState } from "react";

const CodeScreen = ({ email, code, setCode, loading, onChangeEmail, onSubmit, onSendCode }) => {
    const inputsRef = useRef([]);
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutos

    useEffect(() => {
        if (timeLeft <= 0) return;
        const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(id);
    }, [timeLeft]);

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newCode = code.split('');
        newCode[index] = value;
        const joined = newCode.join('');
        setCode(joined);

        if (value && index < 5) {
            inputsRef.current[index + 1].focus();
        }

        // Auto-submit when code is complete and not loading
        // if (joined.length === 6 && !loading) {
        //     setTimeout(() => {
        //         onSubmit(new Event('submit'));
        //     }, 0);
        // }
    };

    useEffect(() => {
        if (code.length === 6) {
            onSubmit(new Event('submit'));
        }
    }, [code])

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
        // Submit on Enter if code is complete
        if (e.key === 'Enter' && code.length === 6 && !loading) {
            onSubmit(e);
        }
    };

    // Handle paste: clean non-digits and distribute into inputs
    const handlePaste = e => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        const newCode = code.split('');
        pasted.split('').forEach((d, i) => {
            if (i < 6) newCode[i] = d;
        });
        const joined = newCode.join('');
        setCode(joined);

        // Focus the next empty input or the last one
        const nextEmpty = newCode.findIndex((c, i) => !c && i < 6);
        const focusIndex = nextEmpty === -1 ? Math.min(5, pasted.length - 1) : nextEmpty;
        if (inputsRef.current[focusIndex]) {
            inputsRef.current[focusIndex].focus();
            // Dispatch keydown so the component picks up the value
            inputsRef.current[focusIndex].dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
            );
        }
    };

    // Formatear tiempo como mm:ss
    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        if (loading) return
        setTimeLeft(120)
    }, [loading])

    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-center">Ingresa tu código</h4>
            <p className='text-center w-full text-gray-600'>
                <span>Hemos enviado un código de 6 dígitos a</span>
                <span className="block text-primary break-all">{email}</span>
            </p>
        </div>
        <form className="text-start" onSubmit={onSubmit}>
            <div className="mb-2 flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <input
                        key={i}
                        ref={el => inputsRef.current[i] = el}
                        type="number"
                        maxLength={1}
                        value={code[i] || ''}
                        required
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        disabled={loading}
                        className="w-12 h-12 text-center text-lg border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                ))}
            </div>

            <p className="text-sm text-center mb-2">
                {timeLeft > 0 ? (
                    <>Reenviar código en <span className="text-secondary">{formatTime(timeLeft)}</span></>
                ) : (
                    <button type="button" className="text-primary underline disabled:cursor-not-allowed" onClick={onSendCode} disabled={loading}>Reenviar código</button>
                )}
            </p>

            <button
                type="button"
                className="text-center mx-auto block text-sm text-primary mb-6 underline disabled:cursor-not-allowed"
                onClick={onChangeEmail}
                disabled={loading}>
                Cambiar correo
            </button>

            <div className="grid">
                <button className="w-full py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55 disabled:cursor-not-allowed" type="submit" disabled={code.length !== 6 || loading}>{
                    loading ? <><i className="mdi mdi-spin mdi-loading me-1" />Verificando</> : 'Confirmar código'
                }</button>
            </div>
        </form>
    </>
}

export default CodeScreen