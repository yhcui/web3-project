export default function Card() {
  return (
    <div className="relative h-[324px] overflow-hidden rounded-[16px] bg-[#111319CC] shadow-lg">
      <div className="relative h-full bg-gradient-to-br from-[#FFB800] to-[#FF7A00]">
        <div className="absolute top-4 right-[-2px]">
          <div className="relative flex h-[26px] w-[72px] items-center bg-[url('/assets/images/campaign/arrow.png')] bg-cover bg-center bg-no-repeat">
            <div className="flex h-full w-full items-center justify-center pl-[10px] text-[14px] leading-none font-bold text-[#30290B]">
              进行中
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 left-0 h-[144px] bg-[#111319CC] p-[20px] text-white">
        <div className="text-[22px] font-bold">🎁 金币大放送</div>
        <div className="mt-[10px] text-[16px]">
          [6月18日] - [7月2日/2025年] (UTC+8)
        </div>
        <div className="mt-[10px] flex w-[126px] cursor-pointer items-center gap-[10px] rounded-[8px] bg-[#FBD537] px-[10px] py-[5px]">
          <div className="flex items-center gap-[10px] text-[14px] text-black">
            1000+USDT
          </div>
          <img
            src="/assets/images/usdt.png"
            alt="gold"
            className="h-[16px] w-[16px]"
          />
        </div>
        <div className="absolute top-[-35px] right-[20px] h-[70px] w-[70px] rounded-full bg-black p-[3px]">
          <img
            src="/assets/images/usdt.png"
            alt="gold"
            className="h-full w-full"
          />
        </div>

        <div className="absolute right-0 bottom-0 flex h-[32px] w-[32px] items-center justify-center rounded-tl-[12px] bg-[linear-gradient(157.07deg,_#FFFEF9_14.86%,_#FFF8DC_82.18%)]">
          <img
            src="/assets/images/usdt.png"
            alt="arrow"
            className="h-[16px] w-[16px]"
          />
        </div>
      </div>
    </div>
  )
}
