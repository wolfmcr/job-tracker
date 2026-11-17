import { ReceiptIcon } from 'lucide-react'
import { useReceiptPhoto } from '../../hooks/useReceipts'

interface Props {
  photoPath?: string
  className?: string
}

// A small picture of the receipt, or a receipt icon when it was typed in
export function ReceiptThumb({ photoPath, className = '' }: Props) {
  const url = useReceiptPhoto(photoPath)
  return (
    <div className={`w-11 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <ReceiptIcon size={20} className="text-gray-400" />}
    </div>
  )
}
