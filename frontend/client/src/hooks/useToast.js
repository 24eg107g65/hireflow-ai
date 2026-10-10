import { useContext } from 'react'
import { ToastContext } from '../context/toastContext'

export function useToast() {
  return useContext(ToastContext)
}