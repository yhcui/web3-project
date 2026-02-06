import PoolDetailClient from './PoolDetailClient';

export default async function PoolPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <PoolDetailClient address={address} />;
}

