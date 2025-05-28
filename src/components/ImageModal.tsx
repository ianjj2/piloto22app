import Image from 'next/image'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  productName: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, productName }: ImageModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl w-full h-[80vh] bg-transparent rounded-lg" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-red-500 transition-colors"
        >
          Fechar
        </button>
        <div className="w-full h-full relative">
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </div>
      </div>
    </div>
  )
} 