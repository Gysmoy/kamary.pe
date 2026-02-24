import JSEncrypt from 'jsencrypt'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript'
import Global from './Utils/Global'
import Base from './Components/Tailwind/Base'
import RegisterRest from './Actions/register-rest'

import RegisterScreen from './Components/Public/Auth/RegisterScreen'
import CodeScreen from './Components/Public/Auth/CodeScreen'
import ProfileScreen from './Components/Public/Auth/ProfileScreen'
import SummaryScreen from './Components/Public/Auth/SummaryScreen'
import { useBase } from './Components/Tailwind/BaseContext'

const registerRest = new RegisterRest()

const Register = ({ }) => {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(Global.PUBLIC_RSA_KEY)

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [lastname, setLastname] = useState('')
  const [documentType, setDocumentType] = useState('DNI')
  const [documentNumber, setDocumentNumber] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const [newUser, setNewUser] = useState(null)

  const { session, setSession } = useBase()

  const onSendCodeSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const request = {
      email: jsEncrypt.encrypt(email)
    }
    const result = await registerRest.send(request)

    setLoading(false)
    if (!result) return

    setStep('code')
  }

  const onVerifyCodeSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const request = {
      email: jsEncrypt.encrypt(email),
      code: jsEncrypt.encrypt(code)
    }
    const result = await registerRest.verify(request)

    setLoading(false)
    if (!result) return

    setStep('profile')
  }

  const onRegisterSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const request = {
      email: jsEncrypt.encrypt(email),
      code: jsEncrypt.encrypt(code),
      name, lastname,
      documentType, documentNumber,
      username
    }
    const result = await registerRest.register(request)

    setLoading(false)
    if (!result) return

    setSession(result.data)
    setNewUser(result.data)
    setStep('summary')
  }

  const goBack = () => {
    if (step === 'email') return
    if (step === 'code') {
      setStep('email')
      setCode('')
    }
    if (step === 'profile') {
      setStep('code')
    }
    // Add more back transitions as new steps are added
  }

  const renderBackButton = () => {
    if (step === 'summary') return null
    if (step === 'email') {
      return (
        <a href='/login' className='flex items-center gap-1 text-xs mb-4 text-[#4B5563]'>
          <i className='ti ti-arrow-left text-xl'></i>
          Iniciar sesión
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
        Atrás
      </button>
    )
  }

  const renderScreen = () => {
    switch (step) {
      case 'code': return <CodeScreen
        email={email}
        code={code}
        setCode={setCode}
        loading={loading}
        onChangeEmail={() => {
          setStep('email')
          setEmail('')
        }}
        onSendCode={onSendCodeSubmit}
        onSubmit={onVerifyCodeSubmit}
      />
      case 'profile': return <ProfileScreen
        email={email}
        name={name}
        setName={setName}
        lastname={lastname}
        setLastname={setLastname}
        documentType={documentType}
        setDocumentType={setDocumentType}
        documentNumber={documentNumber}
        setDocumentNumber={setDocumentNumber}
        username={username}
        setUsername={setUsername}
        onSubmit={onRegisterSubmit}
        loading={loading}
      />
      case 'summary': return <SummaryScreen user={newUser} />
      default: return <RegisterScreen
        email={email}
        setEmail={setEmail}
        onSubmit={onSendCodeSubmit}
        loading={loading}
      />
    }
  }

  return (<>
    <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
      <div className={`${step == 'summary' ? 'max-w-2xl' : 'max-w-lg'} mx-auto px-4 sm:px-6 lg:px-8`}>
        {renderBackButton()}
        <div className='px-6 py-8 bg-white rounded-2xl border border-[#D1D5DC]'>
          {renderScreen()}
        </div>
      </div>
    </section>
  </>)
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Registro'>
    <Register {...properties} />
  </Base>);
})