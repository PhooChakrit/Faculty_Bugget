import EditBudgetPage from "@/features/edit-budget";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EditBudgetPage projectId={id} />;
}
