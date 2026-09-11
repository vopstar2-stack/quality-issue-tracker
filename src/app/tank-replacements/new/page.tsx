import TankReplacementForm from "@/components/TankReplacementForm";

export default function NewTankReplacementPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">누유대체 신품출고 등록</h1>
      <TankReplacementForm mode="create" />
    </div>
  );
}
