export default function PlaceholderPage({ title }) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-lg font-semibold text-[#1A1A2E]">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">This page is coming in a later phase.</p>
    </div>
  )
}
