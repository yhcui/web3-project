import { cn } from '@/lib/utils'
import { LAUNCH_MODE } from '@/enums/tokens'
import { LaunchMode } from '@/types/token'
import ICONIDO from '@/assets/common/icon-ido.svg'
import ICONBURN from '@/assets/common/icon-burn.svg'
import Image from 'next/image'

export default function BadgeLaunchMode({
  value,
  className,
}: {
  value: LaunchMode
  className?: string
}) {
  return value === LAUNCH_MODE.BURN ? (
    <Image
      src={ICONBURN}
      width={16}
      height={16}
      className={cn('h-4 w-4', className)}
      alt="burn"
    />
  ) : value === LAUNCH_MODE.IDO ? (
    <Image
      src={ICONIDO}
      width={16}
      height={16}
      className={cn('h-4 w-4', className)}
      alt="ido"
    />
  ) : (
    <></>
  )
}
