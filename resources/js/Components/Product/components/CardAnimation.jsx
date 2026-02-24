import { useEffect } from 'react'
import '../../../../css/card-animation.css'
import { renderToString } from 'react-dom/server'

const CardAnimation = ({ isOpen, isOk }) => {
    const content = renderToString(<section id="card-animation" className="fixed top-0 left-0 bottom-0 right-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999999999999 }}>
        <div className={`container ${isOk ? 'transaction-ok' : ''}`}>

            <div className="left-side">
                <div className="card">
                    <div className="card-line"></div>
                    <div className="buttons"></div>
                </div>
                <div className="post">
                    <div className="post-line"></div>
                    <div className="screen">
                        <div className="dollar">S/</div>
                    </div>
                    <div className="numbers"></div>
                    <div className="numbers-line2"></div>
                </div>
            </div>
            <div className="right-side">
                <div className="new">{
                isOk 
                ? 'Bien hecho'
                : <>
                <i className='mdi mdi-loading mdi-spin me-2'></i>
                Verificando
                </>
                }</div>
                <svg viewBox="0 0 451.846 451.847" height="512" width="512" xmlns="http://www.w3.org/2000/svg" className="arrow">
                    <path fill="#cfcfcf" data-old_color="#000000" className="active-path" data-original="#000000" d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"></path>
                </svg>
            </div>
        </div>
    </section>);

    useEffect(() => {
        // Remove existing animation if present
        const existingAnimation = document.getElementById('card-animation');
        if (existingAnimation) {
            existingAnimation.remove();
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            // Create a div and set its innerHTML with the content
            const container = document.createElement('div');
            container.innerHTML = content.trim();
            // Append the first child (the section) to body
            document.body.appendChild(container.firstChild);
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }
    }, [isOpen]);

    return <></>;
}

export default CardAnimation
