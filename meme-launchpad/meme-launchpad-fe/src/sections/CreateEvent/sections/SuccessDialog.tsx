import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SuccessDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const currentLocale = usePathname().split('/')[1]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[388px] rounded-2xl border border-[#2B3139] bg-[#1B1E25] px-8 py-5">
        <div className="space-y-2 py-4 text-center text-base">
          <h3 className="text-white">活动创建成功！</h3>
        </div>

        <Link href={`/${currentLocale}/campaign`}>
          <Button className="h-[50px] w-full rounded-lg bg-[#FBD537] text-lg font-bold text-black hover:bg-[#FBD537]/90">
            查看主页 <ArrowRight size={16} />
          </Button>
        </Link>
      </DialogContent>
    </Dialog>
  )
}
