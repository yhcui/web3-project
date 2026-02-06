import { UserStatusResponse } from '@/api/schemas/invite.schema'

export default function Title({
  userInfo,
}: {
  userInfo: UserStatusResponse | undefined
}) {
  return (
    <div className="flex flex-col items-start">
      <div className="mb-2 flex items-center text-[56px]">
        <span className="mr-2">💰</span>
        <span className="leading-tight font-bold text-white">邀请好友</span>
      </div>
      <div className="mb-6 text-[56px] leading-tight font-bold text-[#FFD600]">
        立返高额佣金！
      </div>
      <div className="flex items-center gap-4">
        {userInfo?.isAgent ? (
          <button
            onClick={() => {
              window.open(`https://api-dev.coinroll.io/rebate-admin/`, '_blank')
            }}
            className="rounded-md bg-[#FFD600] px-6 py-3 text-[16px] text-black transition-colors hover:bg-[#ffe066]"
          >
            新增下级代理
          </button>
        ) : (
          <button
            onClick={() => {
              window.open(`https://api-dev.coinroll.io/rebate-admin/`, '_blank')
            }}
            className="rounded-md bg-[#FFD600] px-6 py-3 text-[16px] text-black transition-colors hover:bg-[#ffe066]"
          >
            立即成为代理
          </button>
        )}
        <button className="flex h-12 w-12 items-center justify-center rounded-md border border-[#333] bg-[#232326] text-xl text-white transition-colors hover:bg-[#2c2c2f]">
          <svg
            className="cursor-pointer"
            onClick={() => {
              window.open('https://x.com/coinrollio', '_blank')
            }}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.53764 4.98047L10.3293 12.7246L4.50098 19.0205H5.81264L10.9151 13.508L15.0376 19.0205H19.501L13.3843 10.8413L18.8085 4.98047H17.4968L12.7976 10.0571L9.00098 4.98047H4.53764ZM6.46598 5.94714H8.51764L17.5726 18.0538H15.5226L6.46598 5.94714Z"
              fill="#EAECEF"
            />
          </svg>
        </button>
        <button className="flex h-12 w-12 items-center justify-center rounded-md border border-[#333] bg-[#232326] text-white transition-colors hover:bg-[#2c2c2f]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.1425 16.9786L10.3755 13.4126L16.7672 7.57887C17.0501 7.31753 16.7089 7.19107 16.3344 7.41869L8.44474 12.4684L5.03254 11.3725C4.30017 11.1617 4.29184 10.6475 5.19899 10.2766L18.4899 5.0835C19.0975 4.8053 19.68 5.23525 19.447 6.17944L17.1833 16.9786C17.0252 17.7458 16.5674 17.9313 15.9349 17.5772L12.4894 14.9975L10.8333 16.6246C10.6419 16.8185 10.4837 16.9786 10.1425 16.9786Z"
              fill="white"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
