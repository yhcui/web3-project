import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { SaleKind, Side, makeOrders } from "@/contracts/service/orderBookContract";
import { useAccount } from 'wagmi'
import { parseEther } from "ethers";
import { useEthersSigner } from "@/hooks/useEthersSigner";

interface PlaceItemBidDialogProps {
  open: boolean;
  close: () => void;
  collectionAddress: string;
  tokenId: string | number;
  itemName?: string;
  itemImage?: string;
}

export function PlaceItemBidDialog({
  open,
  close,
  collectionAddress,
  tokenId,
  itemName,
  itemImage,
}: PlaceItemBidDialogProps) {
  const { address: owner } = useAccount();
  const signer = useEthersSigner();
  const [price, setPrice] = useState<string>("");
  const [expiryDays, setExpiryDays] = useState<string>("30");
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingStatus, setPlacingStatus] = useState<string>("");

  const handlePlaceBid = async () => {
    if (!signer || !owner) {
      alert("请先连接钱包");
      return;
    }

    // 验证输入
    const priceNum = parseFloat(price);
    const expiryDaysNum = parseFloat(expiryDays);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert("请输入有效的价格");
      return;
    }

    if (isNaN(expiryDaysNum) || expiryDaysNum <= 0) {
      alert("请输入有效的过期天数");
      return;
    }

    try {
      setIsPlacing(true);
      setPlacingStatus("准备创建买单...");

      // 计算过期时间（当前时间 + 指定天数）
      const now = Math.floor(Date.now() / 1000);
      const expiry = now + Math.floor(expiryDaysNum * 24 * 60 * 60);

      // 创建买单订单
      // 参考测试用例：针对单个item的买单，使用 FixedPriceForItem
      const order = {
        side: Side.Bid,
        saleKind: SaleKind.FixedPriceForItem,
        maker: owner,
        nft: {
          tokenId: tokenId,
          collection: collectionAddress,
          amount: 1, // 单个item的买单，数量固定为1
        },
        price: parseEther(price),
        expiry: expiry,
        salt: Date.now(), // 使用时间戳确保唯一性
      };

      console.log("准备创建的买单订单:", order);

      setPlacingStatus("发送交易...");

      // 计算需要锁定的ETH总额 = price * 1
      // makeOrders函数期望value是ETH字符串格式（如"0.1"），ethers会自动转换为wei
      const result = await makeOrders(signer, [order], {
        value: price, // 买单需要锁定ETH，金额等于价格
      });

      console.log("挂买单成功:", result);
      setPlacingStatus("挂买单成功！");
      alert(`挂买单成功！交易哈希: ${result.transactionHash}`);

      // 重置状态
      setPrice("");
      setExpiryDays("30");
      close();
    } catch (error: any) {
      console.error("挂买单失败:", error);
      let errorMessage = error.message;

      // 根据错误类型提供更友好的提示
      if (errorMessage.includes("missing revert data")) {
        errorMessage =
          "交易可能会失败，请检查：\n1. 价格是否有效\n2. 网络是否正确\n3. 钱包余额是否足够支付ETH和gas费\n4. 集合地址和tokenId是否正确";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage = "用户取消了交易";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "余额不足，请确保钱包有足够的ETH支付买单金额和gas费";
      }

      alert(`挂买单失败: ${errorMessage}`);
    } finally {
      setIsPlacing(false);
      setPlacingStatus("");
    }
  };

  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={close}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl transition-all border border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    挂买单
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 mt-1">
                    为单个NFT创建买单订单
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={close}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Item信息 */}
                {itemImage && (
                  <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <img
                      src={itemImage}
                      alt={itemName || `Token #${tokenId}`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">NFT</div>
                      <div className="text-lg font-semibold text-white">
                        {itemName || `Token #${tokenId}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Token ID: {tokenId}
                      </div>
                    </div>
                  </div>
                )}

                {/* 集合地址 */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-2">集合地址</div>
                  <div className="text-sm font-mono text-white break-all">
                    {collectionAddress}
                  </div>
                </div>

                {/* 价格输入 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    出价 (ETH)
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500">
                    您愿意为这个NFT支付的价格
                  </p>
                </div>

                {/* 过期天数 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    过期天数
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="30"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500">
                    订单将在指定天数后过期
                  </p>
                </div>

                {/* 总金额显示 */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">需要锁定的ETH</span>
                    <span className="text-lg font-bold text-blue-400">
                      {price ? `${parseFloat(price).toFixed(6)} ETH` : "0 ETH"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    这些ETH将被锁定在合约中，直到订单被匹配或取消
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
                <Button
                  variant="outline"
                  onClick={close}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  取消
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={!price || parseFloat(price) <= 0 || isPlacing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacing
                    ? (placingStatus || "挂买单中...")
                    : "确认挂买单"}
                </Button>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  );
}

