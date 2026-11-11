import { redirect } from "next/navigation";

export default async function NewRequestRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const target = studentId
    ? `/parent/requests?action=new&studentId=${encodeURIComponent(studentId)}`
    : `/parent/requests?action=new`;

  redirect(target);
}

