import ViewProjectPage from "@/features/view-project";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ViewProjectPage projectId={id} />;
}
