import { useState } from "react";
import buildSchedule from "../../../Utils/buildSchedule";

const DeliveryPointScreen = ({ deliveryPoints, points, setPoints, goBack, onSubmit }) => {

    const toggleDeliveryPoint = (pointId) => {
        setPoints(prev => {
            const exists = prev.includes(pointId);
            if (exists) {
                return prev.filter(id => id !== pointId);
            } else {
                return [...prev, pointId];
            }
        });
    }

    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-start">Selecciona los puntos de entregas</h4>
            <p className='text-start w-full text-gray-600 mb-2'>Elige dónde pueden recoger esta tarjeta los compradores. Puedes seleccionar varias ubicaciones.</p>
            <span className='block p-2 text-xs border border-red-500 text-red-500 bg-red-50 rounded mb-6'>⚠️ Seleccione al menos un lugar de recogida para continuar</span>
        </div>
        <form onSubmit={onSubmit} className="text-start" >
            <div className='grid md:grid-cols-1 gap-4 mb-6'>
                {
                    deliveryPoints.map(point => {
                        const isSelected = points.includes(point.id);
                        return (
                            <div
                                key={point.id}
                                onClick={() => toggleDeliveryPoint(point.id)}
                                className={`relative border p-4 rounded-xl  cursor-pointer ${isSelected ? 'border-primary' : 'border-gray-300'}`}
                            >
                                <div className="w-full flex items-center justify-between gap-4 mb-2">
                                    <span className='w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center'>
                                        <i className='mdi mdi-store text-silver'></i>
                                    </span>
                                    <div className='flex-1'>
                                        <h4 className='mb-0'>{point.name}</h4>
                                        <span className='block text-silver text-sm'>{point.district}, {point.department}</span>
                                    </div>
                                </div>
                                <ul className='text-silver text-sm grid gap-1'>
                                    <li>
                                        <i className='mdi mdi-map-marker-outline me-1' />
                                        <span>{point.address} {point.number} {point.reference && `(${point.reference})`}</span>
                                    </li>
                                    <li>
                                        <i className='mdi mdi-clock-outline me-1' />
                                        <span>{buildSchedule(point.opening_hours)}</span>
                                    </li>
                                </ul>
                                {
                                    isSelected &&
                                    <i
                                        className={`mdi mdi-checkbox-marked-outline text-2xl text-primary absolute top-6 right-6 cursor-pointer`}
                                    />
                                }
                            </div>
                        );
                    })
                }
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button className="block w-full text-center py-3 px-4 text-sm border border-primary text-primary rounded-lg hover:opacity-80" type="button"
                    onClick={goBack}>
                    Volver
                </button>
                <button
                    className="w-full py-3 px-4 text-sm bg-primary text-white rounded-lg hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={points.length == 0}
                >
                    Activar perfil
                </button>
            </div>
        </form>
    </>
}

export default DeliveryPointScreen