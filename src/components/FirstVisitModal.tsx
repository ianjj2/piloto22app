'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import Image from 'next/image'

interface FirstVisitModalProps {
  isOpen: boolean
  onChoice: (hasAccount: boolean) => void
}

export default function FirstVisitModal({ isOpen, onChoice }: FirstVisitModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1a0808] border border-red-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white text-center"
                >
                  Bem-vindo ao Aviator!
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-sm text-gray-300 text-center">
                    Você já possui uma conta na copapix?
                  </p>
                </div>

                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                    onClick={() => onChoice(true)}
                  >
                    Sim, já tenho conta
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-800/20 focus:outline-none"
                    onClick={() => onChoice(false)}
                  >
                    Não, quero me cadastrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 