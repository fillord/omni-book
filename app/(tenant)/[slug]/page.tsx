import { TenantPublicPage } from '@/components/tenant-public-page'

export default async function TenantSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <TenantPublicPage slug={slug} />
}
