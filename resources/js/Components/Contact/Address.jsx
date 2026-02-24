import React from "react"
import { MapPin, Phone, Clock } from 'lucide-react';
import Global from "../../Utils/Global";

const ContactItem = ({ icon: Icon, title, children }) => (
  <div className="bg-slate-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-6">
    <Icon className="w-8 h-8 text-[#F8B62C] mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <div className="text-sm text-gray-600">{children}</div>
  </div>
);

const Address = ({ generals }) => {
  const location = (generals.find(x => x.correlative == 'location')?.description ?? '0,0').split(',').map(x => Number(x.trim()));
  const lat = location[0];
  const lng = location[1];

  return (
    <>
      <div className="w-full max-w-7xl mx-auto p-[5%] mt-16 font-sans">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            ¡Siempre estamos <span className="text-pink-600">pendiente</span> de usted!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Puede llamarnos en horario laboral o visitar nuestra oficina. Todos los correos electrónicos recibirán respuesta en un plazo de 24 horas. ¡Nos encantaría saber de usted!
          </p>
        </div>

        <div className="flex flex-wrap -mx-4">
          <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
            <ContactItem icon={MapPin} title="Dirección">
              {generals.find(x => x.correlative == 'address')?.description}
            </ContactItem>

            <ContactItem icon={Phone} title="Contacto">
              {generals.find(x => x.correlative == 'phone_contact')?.description?.split(',').map((x, index) => <p key={index}>{x.trim()}</p>)}
              {generals.find(x => x.correlative == 'email_contact')?.description?.split(',').map((x, index) => <p key={index}>{x.trim()}</p>)}
            </ContactItem>

            <ContactItem icon={Clock} title="Horario de Funcionamiento">
              {generals.find(x => x.correlative == 'opening_hours')?.description?.split('\n').map((x, index) => <p key={index}>{x.trim()}</p>)}
            </ContactItem>
          </div>

          <div className="w-full md:w-2/3 px-4">
            <div className="relative w-full h-0 pb-[75%] rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${Global.GMAPS_API_KEY}&q=${lat},${lng}&zoom=15`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Address;
