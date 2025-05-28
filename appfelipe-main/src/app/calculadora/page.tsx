'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPercent } from 'react-icons/fi'

export default function Calculadora() {
  const router = useRouter()
  const [banca, setBanca] = useState('')
  const [stopGain, setStopGain] = useState('10')
  const [stopLoss, setStopLoss] = useState('5')
  const [loading, setLoading] = useState(false)

  // Calcula os valores de stop gain, loss e entrada sugerida
  const calcularValores = () => {
    const bancaNum = parseFloat(banca.replace('R$', '').replace(',', '.'))
    if (isNaN(bancaNum)) return { gain: 0, loss: 0, entradaSugerida: 0 }
    
    const gainValue = (bancaNum * parseFloat(stopGain)) / 100
    const lossValue = (bancaNum * parseFloat(stopLoss)) / 100
    const entradaSugerida = (bancaNum * 0.01) // 1% da banca
    
    return {
      gain: Number((bancaNum + gainValue).toFixed(2)),
      loss: Number((bancaNum - lossValue).toFixed(2)),
      entradaSugerida: Number(entradaSugerida.toFixed(2))
    }
  }

  const { gain, loss, entradaSugerida } = calcularValores()

  const handleSave = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Você precisa estar logado para salvar')
        return
      }

      const bancaValue = parseFloat(banca.replace('R$', '').replace(',', '.'))

      const { error } = await supabase
        .from('calculator_settings')
        .upsert({
          user_id: session.user.id,
          banca: bancaValue,
          stop_gain: parseFloat(stopGain),
          stop_loss: parseFloat(stopLoss),
          stop_gain_value: gain,
          stop_loss_value: loss,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
      router.push('/aviator')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar as configurações')
    } finally {
      setLoading(false)
    }
  }

  // Formata o input da banca para moeda
  const formatarBanca = (value: string) => {
    value = value.replace(/\D/g, '')
    value = (parseFloat(value) / 100).toFixed(2)
    value = value.replace('.', ',')
    value = `R$ ${value}`
    return value
  }

  const handleBancaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (!value) {
      setBanca('')
      return
    }
    setBanca(formatarBanca(value))
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      <Image
        src="/assets/Fundo.jpg"
        alt="Background"
        fill
        sizes="100vw"
        className="object-cover"
        quality={100}
        priority
      />
      <div className="w-full max-w-lg p-8 rounded-3xl glass-effect border-2 border-red-800/60 shadow-2xl relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-20 mb-2 relative">
            <Image
              src="/assets/Logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 100vw, 160px"
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold text-red-400 mb-2 tracking-wide text-center">Calculadora de Banca</h1>
        </div>

        <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-4">
            <div className="relative flex items-center">
              <label htmlFor="banca" className="block text-sm font-medium text-red-300 mb-1 absolute -top-6 left-0">Valor da Banca</label>
              <span className="pl-3 flex items-center h-12 absolute pointer-events-none">
                <FiDollarSign className="text-red-400 text-lg" />
              </span>
              <input
                id="banca"
                type="text"
                value={banca}
                onChange={handleBancaChange}
                placeholder="R$ 0,00"
                className="w-full pl-10 pr-4 py-3 bg-[#2a1010]/70 border border-red-800/40 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative flex items-center">
                <label htmlFor="stopGain" className="block text-sm font-medium text-red-300 mb-1 absolute -top-6 left-0">Stop Gain (%)</label>
                <span className="pl-3 flex items-center h-12 absolute pointer-events-none">
                  <FiTrendingUp className="text-green-400 text-lg" />
                </span>
                <input
                  id="stopGain"
                  type="number"
                  value={stopGain}
                  onChange={(e) => setStopGain(e.target.value)}
                  min="0"
                  max="100"
                  className="w-full pl-10 pr-4 py-3 bg-[#2a1010]/70 border border-green-800/40 rounded-xl text-white placeholder-green-400/60 focus:outline-none focus:border-2 focus:border-green-500 transition-all duration-200 shadow-sm h-12"
                />
              </div>
              <div className="relative flex items-center">
                <label htmlFor="stopLoss" className="block text-sm font-medium text-red-300 mb-1 absolute -top-6 left-0">Stop Loss (%)</label>
                <span className="pl-3 flex items-center h-12 absolute pointer-events-none">
                  <FiTrendingDown className="text-red-400 text-lg" />
                </span>
                <input
                  id="stopLoss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  min="0"
                  max="100"
                  className="w-full pl-10 pr-4 py-3 bg-[#2a1010]/70 border border-red-800/40 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm h-12"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-900/30 border border-blue-700/60 shadow-sm">
              <FiPercent className="text-blue-400 text-2xl" />
              <div>
                <p className="text-xs text-blue-300 font-medium">Entrada Sugerida (1%)</p>
                <p className="text-xl font-bold text-blue-400">R$ {entradaSugerida}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/30 border border-green-700/60 shadow-sm">
              <FiTrendingUp className="text-green-400 text-2xl" />
              <div>
                <p className="text-xs text-green-300 font-medium">Stop Gain (Alvo Total)</p>
                <p className="text-xl font-bold text-green-400">R$ {gain.toFixed(2)}</p>
                <p className="text-xs text-green-300/80 mt-1">Ganho: R$ {(gain - parseFloat(banca.replace('R$', '').replace(',', '.'))).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/30 border border-red-700/60 shadow-sm">
              <FiTrendingDown className="text-red-400 text-2xl" />
              <div>
                <p className="text-xs text-red-300 font-medium">Stop Loss (Limite Total)</p>
                <p className="text-xl font-bold text-red-400">R$ {loss.toFixed(2)}</p>
                <p className="text-xs text-red-300/80 mt-1">Perda: R$ {(parseFloat(banca.replace('R$', '').replace(',', '.')) - loss).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !banca}
            className={`w-full py-3 mt-6 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:scale-[1.03] hover:shadow-lg text-white rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 shadow-md`}
          >
            {loading ? 'Salvando...' : 'Salvar e Jogar'}
          </button>
        </form>
        <style jsx global>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
          }
        `}</style>
      </div>
    </main>
  )
} 