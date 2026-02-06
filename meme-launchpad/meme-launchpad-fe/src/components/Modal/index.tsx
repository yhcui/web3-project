import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import IconClose from '@public/images/modal/close.svg'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import useIsMobile from '@/hooks/use-is-mobile'

interface ModalProps {
  open?: boolean
  onClose?: () => void
  children: React.ReactNode
  closeIcon?: React.ReactNode
  style?: React.CSSProperties
  className?: string
  closeIconClassName?: string
  isForceNormal?: boolean
  innerStyle?: React.CSSProperties
  innerClassName?: string
  contentClassName?: string
  isMaskClose?: boolean
  isShowCloseIcon?: boolean
}

const Modal: React.FC<ModalProps> = (props) => {
  const { children, ...restProps } = props

  if (!props.open || typeof document === 'undefined') return null

  return ReactDOM.createPortal(
    (<ModalContent {...restProps}>{children}</ModalContent>) as any,
    document.body
  ) as unknown as React.ReactPortal
}

export default Modal

export const ModalContent = (props: ModalProps) => {
  const {
    open,
    onClose,
    children,
    closeIcon,
    style,
    className,
    closeIconClassName,
    isForceNormal,
    innerStyle,
    innerClassName,
    contentClassName,
    isMaskClose = true,
    isShowCloseIcon = true,
  } = props

  const isMobile = useIsMobile()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMaskClose) return
    if (e.target === e.currentTarget || isMobile) {
      onClose && onClose()
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence mode="wait">
      <div
        className={`bg-opacity-50 fixed inset-0 z-[100] flex bg-black lg:items-center lg:justify-center ${className}`}
        style={style}
        onClick={handleBackdropClick}
      >
        <div
          className={`relative rounded-lg ${innerClassName}`}
          style={innerStyle}
        >
          {isShowCloseIcon && (closeIcon || onClose) ? (
            <button
              onClick={onClose}
              className={`absolute top-5 right-5 z-[100] cursor-pointer ${closeIconClassName}`}
            >
              {closeIcon ? closeIcon : <IconClose />}
            </button>
          ) : null}
          {isMobile && !isForceNormal ? (
            <motion.div
              animate={{
                y: [100, 0],
                transition: {
                  duration: 0.3,
                },
              }}
              exit={{
                y: [0, 100],
              }}
              className={clsx(
                'absolute bottom-0 left-0 w-screen rounded-t-[20px]',
                contentClassName
              )}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {children}
            </motion.div>
          ) : (
            children
          )}
        </div>
      </div>
    </AnimatePresence>
  )
}
