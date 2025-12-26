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
import { parseEther, formatEther } from "ethers";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useGlobalState } from "@/hooks/useGlobalState";

interface PlaceBidDialogProps {
  open: boolean;
  close: () => void;
  collectionAddress: string;
}

export function PlaceBidDialog({
  open,
  close,
  collectionAddress,
}: PlaceBidDialogProps) {
  const { address: owner } = useAccount();
  const signer = useEthersSigner();
  const { state } = useGlobalState();
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [expiryDays, setExpiryDays] = useState<string>("30");
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingStatus, setPlacingStatus] = useState<string>("");

  // 计算总金额
  const totalAmount = (() => {
    try {
      const priceNum = parseFloat(price);
      const amountNum = parseFloat(amount);
      if (isNaN(priceNum) || isNaN(amountNum) || priceNum <= 0 || amountNum <= 0) {
        return "0";
      }
      return (priceNum * amountNum).toFixed(6);
    } catch {
      return "0";
    }
  })();

  const handlePlaceBid = async () => {
    if (!signer || !owner) {
      alert("请先连接钱包");
      return;
    }

    // 验证输入
    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);
    const expiryDaysNum = parseFloat(expiryDays);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert("请输入有效的价格");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      alert("请输入有效的数量（必须是整数）");
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
      // 参考测试用例：对于集合的买单，使用 FixedPriceForCollection
      const order = {
        side: Side.Bid,
        saleKind: SaleKind.FixedPriceForCollection,
        maker: owner,
        nft: {
          tokenId: 0, // 集合买单时tokenId可以是0或任意值
          collection: collectionAddress,
          amount: amountNum, // 数量
        },
        price: parseEther(price),
        expiry: expiry,
        salt: Date.now(), // 使用时间戳确保唯一性
      };

      console.log("准备创建的买单订单:", order);

      setPlacingStatus("发送交易...");

      // 计算需要锁定的ETH总额 = price * amount
      // makeOrders函数期望value是ETH字符串格式（如"0.1"），ethers会自动转换为wei
      const result = await makeOrders(signer, [order], {
        value: totalAmount, // 买单需要锁定ETH，传递ETH字符串值
      });

      console.log("挂买单成功:", result);
      setPlacingStatus("挂买单成功！");
      alert(`挂买单成功！交易哈希: ${result.transactionHash}`);

      // 重置状态
      setPrice("");
      setAmount("1");
      setExpiryDays("30");
      close();
    } catch (error: any) {
      console.error("挂买单失败:", error);
      let errorMessage = error.message;

      // 根据错误类型提供更友好的提示
      if (errorMessage.includes("missing revert data")) {
        errorMessage =
          "交易可能会失败，请检查：\n1. 价格和数量是否有效\n2. 网络是否正确\n3. 钱包余额是否足够支付ETH和gas费\n4. 集合地址是否正确";
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
                    为整个集合创建买单订单
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
                {/* 集合信息 */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-2">集合地址</div>
                  <div className="text-sm font-mono text-white break-all">
                    {collectionAddress}
                  </div>
                </div>

                {/* 价格输入 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    单价 (ETH)
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
                    每个NFT的购买价格
                  </p>
                </div>

                {/* 数量输入 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    数量
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-500">
                    想要购买的NFT数量（整数）
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
                    <span className="text-sm text-gray-300">需要锁定的ETH总额</span>
                    <span className="text-lg font-bold text-blue-400">
                      {totalAmount} ETH
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
                  disabled={!price || parseFloat(price) <= 0 || !amount || parseFloat(amount) <= 0 || isPlacing}
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

