import JSEncrypt from 'jsencrypt'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript'
import Global from './Utils/Global'
import Base from './Components/Tailwind/Base'

import SummaryScreen from './Components/Public/Onboarding/SummaryScreen'
import { useBase } from './Components/Tailwind/BaseContext'
import ContactScreen from './Components/Public/Onboarding/ContactScreen'
import PaymentMethodScreen from './Components/Public/Onboarding/PaymentMethodScreen'
import OnboardingRest from './Actions/onboarding-rest'
import DeliveryPointScreen from './Components/Public/Onboarding/DeliveryPointScreen'

const onboardingRest = new OnboardingRest()

const Onboarding = ({ ubigeo, prefixes, deliveryPoints }) => {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(Global.PUBLIC_RSA_KEY)

  const [step, setStep] = useState('contact')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('Lima')
  const [district, setDistrict] = useState('')
  const [accountType, setAccountType] = useState('cci')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountCci, setAccountCci] = useState('')
  const [holderName, setHolderName] = useState('')
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const request = {
      phonePrefix,
      phone,
      department: 'Lima',
      province, district,
      accountType,
      accountNumber,
      accountCci,
      holderName,
      points
    }
    const result = await onboardingRest.save(request)

    setLoading(false)
    if (!result) return

    setStep('summary')
  }

  const goBack = () => {
    if (step === 'contact') return
    if (step === 'payment-method') {
      setStep('contact')
    }
    if (step === 'delivery-point') {
      setStep('payment-method')
    }
  }

  const renderBackButton = () => {
    if (step === 'summary') return null
    if (step === 'contact') {
      return (
        <a href='/' className='flex items-center gap-1 text-xs mb-4 text-[#4B5563]'>
          <i className='ti ti-arrow-left text-xl'></i>
          Cancelar
        </a>
      )
    }
    return (
      <button
        type='button'
        onClick={goBack}
        className='flex items-center gap-1 text-xs mb-4 text-[#4B5563]'
      >
        <i className='ti ti-arrow-left text-xl'></i>
        Volver
      </button>
    )
  }

  const renderScreen = () => {
    switch (step) {
      case 'payment-method': return <PaymentMethodScreen
        accountType={accountType}
        setAccountType={setAccountType}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        accountCci={accountCci}
        setAccountCci={setAccountCci}
        holderName={holderName}
        setHolderName={setHolderName}
        goBack={goBack}
        onSubmit={(e) => {
          setStep('delivery-point')
          e.preventDefault()
        }}
      />

      case 'delivery-point': return <DeliveryPointScreen
        deliveryPoints={deliveryPoints}
        points={points}
        setPoints={setPoints}
        loading={loading}
        goBack={goBack}
        onSubmit={handleOnboardingSubmit}
      />
      case 'summary': return <SummaryScreen />
      default: return <ContactScreen
        prefixes={prefixes}
        phonePrefix={phonePrefix}
        setPhonePrefix={setPhonePrefix}
        phone={phone}
        setPhone={setPhone}
        province={province}
        setProvince={setProvince}
        district={district}
        setDistrict={setDistrict}
        ubigeo={ubigeo}
        onSubmit={(e) => {
          setStep('payment-method')
          e.preventDefault()
        }}
        loading={loading}
      />
    }
  }

  return (<>
    <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
      <div className={`max-w-2xl mx-auto px-4 sm:px-6 lg:px-8`}>
        {renderBackButton()}
        <div className='px-6 py-8 bg-white rounded-2xl border border-[#D1D5DC]'>
          {
            step != 'summary' &&
            <div className='mb-8'>
              <div className='grid grid-cols-3 gap-2 mb-2'>
                <div className={`h-1 ${step === 'contact' || step === 'payment-method' || step === 'delivery-point' ? 'bg-primary' : 'bg-[#E5E7EB]'} rounded-full`} />
                <div className={`h-1 ${step === 'payment-method' || step === 'delivery-point' ? 'bg-primary' : 'bg-[#E5E7EB]'} rounded-full`} />
                <div className={`h-1 ${step === 'delivery-point' ? 'bg-primary' : 'bg-[#E5E7EB]'} rounded-full`} />
              </div>
              <span className='text-sm text-[#4B5563]'>
                Paso {step === 'contact' ? 1 : step === 'payment-method' ? 2 : 3} de 3
              </span>
            </div>
          }
          {renderScreen()}
        </div>
      </div>
    </section>
  </>)
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Registro'>
    <Onboarding {...properties} />
  </Base>);
})