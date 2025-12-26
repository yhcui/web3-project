import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { PlaceBidDialog } from "./place-bid-dialog";

export function CollectionHeader() {
  const { state } = useGlobalState();
  const router = useRouter();
  const pathname = usePathname();
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  
  // 从path或state中获取collection地址
  const collectionAddress = state.collection?.address || state.collection_address || (pathname ? pathname.split("/").pop() || "" : "");

  return (
    <div className="border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {!state.collection && <div>loading...</div>}
        {state.collection && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => router.back()}
              title="返回"
            >
              <ArrowLeft className="h-10 w-10" />
            </Button>
            <img
              src={state.collection?.image_uri}
              alt="Collection"
              className="h-12 w-12 rounded-full"
            />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {state.collection?.name}
              </h1>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Star className="h-4 w-4" />
              </Button>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <div className="text-muted-foreground">1天交易量</div>
                  <div>{parseFloat(state.collection?.volume_24h).toFixed(2)}ETH</div>
                </div>
                <div>
                  <div className="text-muted-foreground">总交易量</div>
                  <div>{parseFloat(state.collection?.volume_total).toFixed(2)}ETH</div>
                </div>
                <div>
                  <div className="text-muted-foreground">持有者</div>
                  <div>
                    <span>{state.collection?.owner_amount}</span>
                    <span>
                      (
                      {((state.collection?.owner_amount /
                        state.collection?.total_supply) * 100).toFixed(2)}%
                      )
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">供应量</div>
                  <div>{state.collection?.total_supply}</div>
                </div>
              </div>
              <Button
                onClick={() => setIsBidDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                挂买单
              </Button>
            </div>
          </div>
        )}
      </div>
      {collectionAddress && (
        <PlaceBidDialog
          open={isBidDialogOpen}
          close={() => setIsBidDialogOpen(false)}
          collectionAddress={collectionAddress}
        />
      )}
    </div>
  );
}
