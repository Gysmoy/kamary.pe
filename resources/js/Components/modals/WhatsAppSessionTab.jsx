import Swal from "sweetalert2";
import Tippy from "@tippyjs/react";
import { Fetch } from "sode-extend-react";
import Global from "../../Utils/Global";
import WhatsAppRest from "../../actions/Admin/WhatsAppRest";
import { useEffect, useRef, useState } from "react";
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import { toast } from "sonner";

const whatsAppRest = new WhatsAppRest()

const WhatsAppSessionTab = ({
    active,
    session,
    status: externalStatus,
    setStatus: externalSetStatus,
    isModalOpen
}) => {
    const [status, setStatus] = useState(null);
    const [sessionInfo, setSessionInfo] = useState({});
    const [percent, setPercent] = useState(0);
    const [eventSource, setEventSource] = useState(null);
    const qrRef = useRef();
    const phoneRef = useRef();

    // Use either external or internal status management based on session prop
    const currentStatus = session ? status : externalStatus;
    const setCurrentStatus = session ? setStatus : externalSetStatus;

    const { color, icon, text } = WhatsAppStatuses[currentStatus] ?? {};

    const verifyStatus = async () => {
        const { status: responseStatus, data } = await whatsAppRest.verify(session)
        if (responseStatus == 200) {
            setCurrentStatus('ready')
            setSessionInfo(data)
        } else if (responseStatus == 404) {
            setCurrentStatus('close')
        } else {
            setCurrentStatus(null)
        }
    }

    useEffect(() => {
        if (currentStatus === 'verifying') {
            const searchParams = new URLSearchParams()
            if (session) searchParams.append('session', session)

            const source = new EventSource(`/api/whatsapp/verify?${searchParams}`)
            setEventSource(source)

            source.onmessage = ({ data }) => {
                if (data === 'ping') return console.log(`${session || ''} Realtime active`)
                const { status: newStatus, qr, percent: newPercent, info } = JSON.parse(data)

                switch (newStatus) {
                    case 'ping':
                        console.log('Evento del servidor')
                        break;
                    case 'qr':
                        setCurrentStatus('qr')
                        $(qrRef.current).empty()
                        new QRCode(qrRef.current, {
                            text: qr,
                            width: 200,
                            height: 200,
                            colorDark: '#343a40'
                        });
                        break;
                    case 'loading_screen':
                        setCurrentStatus('loading_screen')
                        setPercent(newPercent)
                        break
                    case 'authenticated':
                        setCurrentStatus('authenticated')
                        break
                    case 'ready':
                        setCurrentStatus('ready')
                        setSessionInfo(info)
                        source.close()
                        break
                    case 'close':
                        setCurrentStatus('close')
                        source.close()
                        setTimeout(() => setCurrentStatus('verifying'), 5000)
                        break
                    default:
                        source.close()
                        break;
                }
            }

            source.onerror = () => {
                console.log(`${session || ''} Realtime closed`)
                setCurrentStatus('close')
                source.close()
                setTimeout(() => setCurrentStatus('verifying'), 5000)
            }
        } else if (currentStatus == null && !isModalOpen) {
            console.log(`${session || ''} Realtime closed: Modal cerrado`)
            verifyStatus()
        }

        if (!isModalOpen) return () => eventSource?.close?.()
    }, [currentStatus, isModalOpen])

    const onCloseClicked = async () => {
        const { isConfirmed } = await Swal.fire({
            title: "Estas seguro?",
            text: `Se cerrara la sesion ${session ? `de ${session}` : 'principal'}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: `Cancelar`
        })
        if (!isConfirmed) return

        await Fetch(`/api/whatsapp${session ? `?session=${session}` : ''}`, {
            method: 'DELETE'
        })

        toast.info("Operacion correcta", {
            description: `Se cerro la sesion de ${sessionInfo?.pushname || 'WhatsApp'}`,
            duration: 3000,
            position: "top-right",
            richColors: true,
        });

        setSessionInfo({})
        setCurrentStatus(null)
    }

    const onPingClicked = async () => {
        try {
            const sessionId = session ? `${Global.APP_CORRELATIVE}-${session.toLowerCase()}` : Global.APP_CORRELATIVE
            const { status: responseStatus, result } = await Fetch(`${Global.WA_URL}/api/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: sessionId,
                    to: [phoneRef.current.value],
                    content: 'Ping!\n> Mensaje automatico',
                })
            })

            const message = result?.message ?? 'No se pudo enviar el ping'
            if (!responseStatus && !message.includes('Cannot read properties of undefined (reading \'serialize\')')) {
                throw new Error(message);
            }
            toast.success("Operacion correcta", {
                description: `Se envio el ping a ${phoneRef.current.value}`,
                duration: 3000,
                position: "top-right",
                richColors: true,
            });
        } catch (error) {
            toast.error("Error", {
                description: result.message || "Ocurrió un error inesperado.",
                duration: 3000,
                position: "top-right",
                richColors: true,
            });
        }
    }

    const sessionId = session ? `wa-session-${session.toLowerCase()}` : "wa-session-main"
    const qrId = session ? `${session.toLowerCase()}-qr-code` : "qr-code"

    return (
        <div className={`tab-pane text-center ${active ? 'active' : ''}`} id={sessionId}>
            <i className={`${icon} h1 text-${color} my-2 d-block`}></i>
            <h4 className="mt-2">{text} {currentStatus == 'loading_screen' && percent && `[${percent}%]`}</h4>
            <div ref={qrRef} id={qrId}
                className={`mt-3 text-center mx-auto ${currentStatus == 'qr' ? 'd-block' : 'd-none'}`}
                style={{ width: 'max-content' }}>
            </div>
            {currentStatus === null && (
                <button
                    className="btn btn-sm btn-dark waves-effect waves-light mt-2"
                    onClick={() => setCurrentStatus('verifying')}
                >
                    <i className="mdi mdi-qrcode-plus me-1"></i>
                    Generar QR
                </button>
            )}
            {currentStatus == 'ready' && <div className="d-block py-2">
                <img className="d-block mb-2 avatar-md rounded-circle mx-auto"
                    src={sessionInfo?.profile || `/api/admin/profile/thumbnail/undefined`}
                    onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `/api/admin/profile/thumbnail/undefined`;
                    }}
                    alt={sessionInfo?.pushname} />
                <b>{sessionInfo?.pushname}</b>
                <br />
                <span className="text-muted">{sessionInfo?.me?.user}@{sessionInfo?.me?.server}</span>
                {/* 
                <div className="input-group mt-2">
                    <input ref={phoneRef} type="text" className="form-control form-control-sm" placeholder="Numero receptor" />
                    <Tippy content="Enviar mensaje ping">
                        <button className="btn btn-sm input-group-text btn-dark waves-effect waves-light" type="button" onClick={onPingClicked}>Ping</button>
                    </Tippy>
                </div> 
                */}
            </div>}
            {currentStatus == 'ready' && <button type="button" className="btn btn-danger my-2" onClick={onCloseClicked}>Cerrar sesion</button>}
        </div>
    )
}

export default WhatsAppSessionTab